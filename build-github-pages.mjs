import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE_PATH = '/equinorix-design';
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(projectRoot, 'site-copy');
const outputRoot = path.join(projectRoot, 'pages-dist');

export function prefixRootUrl(value) {
  if (!value.startsWith('/') || value.startsWith('//')) return value;
  if (value === BASE_PATH || value.startsWith(BASE_PATH + '/') || value.startsWith(BASE_PATH + '?') || value.startsWith(BASE_PATH + '#')) return value;
  return BASE_PATH + value;
}

export function rewriteHtml(html) {
  // The complete page-data element is kept byte-for-byte, including its JSON.
  const protectedData = /(<script\b(?=[^>]*\bid\s*=\s*["']page-data["'])[^>]*>[\s\S]*?<\/script\s*>)/gi;
  return html.split(protectedData).map((part, index) => index % 2 ? part : part.replace(
    /\b(href|src|action|poster)(\s*=\s*)(["'])(\/(?!\/)[^"']*)\3/gi,
    (_, attribute, equals, quote, value) => attribute + equals + quote + prefixRootUrl(value) + quote
  )).join('');
}

export function rewriteCss(css) {
  return css.replace(/url\(\s*(["']?)(\/assets\/[^"')\s]*)\1\s*\)/gi,
    (_, quote, value) => 'url(' + quote + prefixRootUrl(value) + quote + ')');
}

export function rewriteJavaScript(source, fileName = '') {
  // Deliberately leave root-path checks such as source.startsWith('/') alone.
  let result = source.replace(/(["'])(\/assets\/[^"'\r\n]*)\1/g,
    (_, quote, value) => quote + prefixRootUrl(value) + quote);
  if (path.basename(fileName) === 'config.js') {
    result = result.replace(/(\bcontactEndpoint\s*:\s*)(["'])\/api\/contact\2/g,
      (_, property, quote) => property + quote + prefixRootUrl('/api/contact') + quote);
  }
  return result;
}

async function regularFiles(directory, relative = '') {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in the Pages artifact: ' + name);
    if (entry.isDirectory()) files.push(...await regularFiles(path.join(directory, entry.name), name));
    else if (entry.isFile()) files.push(name);
    else throw new Error('Unsupported source entry: ' + name);
  }
  return files;
}

export async function buildGitHubPages() {
  // Verify the absolute generated target before recursively replacing it.
  const target = path.resolve(outputRoot);
  if (path.dirname(target) !== path.resolve(projectRoot) || path.basename(target) !== 'pages-dist' || target === path.resolve(sourceRoot)) {
    throw new Error('Refusing to replace an unexpected output directory.');
  }
  const files = await regularFiles(sourceRoot);
  if (!files.includes('index.html')) throw new Error('Build site-copy first: index.html is missing.');
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(sourceRoot, target, { recursive: true });
  for (const relative of files) {
    const file = path.join(target, relative);
    const extension = path.extname(file).toLowerCase();
    if (!['.html', '.css', '.js', '.mjs'].includes(extension)) continue;
    const original = await fs.readFile(file, 'utf8');
    const rewritten = extension === '.html' ? rewriteHtml(original)
      : extension === '.css' ? rewriteCss(original)
      : rewriteJavaScript(original, file);
    if (rewritten !== original) await fs.writeFile(file, rewritten);
  }
  await fs.writeFile(path.join(target, '.nojekyll'), '');
  console.log(JSON.stringify({ built: true, basePath: BASE_PATH, output: 'pages-dist', files: files.length + 1 }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildGitHubPages();
}
