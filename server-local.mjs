import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site-copy');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.ttf':'font/ttf', '.mp4':'video/mp4', '.webm':'video/webm' };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; font-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src 'self' https:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/contact') {
    res.writeHead(503, {'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify({success:false,code:'EMAIL_NOT_CONFIGURED'}));
    req.resume();
    return;
  }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return; }
  try {
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/en/' || pathname === '/en') { res.writeHead(302,{'Location':'/'});res.end();return; }
    if (pathname === '/ua/' || pathname === '/ua') { res.writeHead(302,{'Location':'/uk/'});res.end();return; }
    const filename = path.resolve(root, '.' + pathname);
    if (filename !== root && !filename.startsWith(root + path.sep)) throw new Error('Forbidden path');
    let candidate = filename;
    const stat = await fs.stat(candidate);
    if (stat.isDirectory()) candidate = path.join(candidate,'index.html');
    const content = await fs.readFile(candidate);
    res.writeHead(200,{'Content-Type':mime[path.extname(candidate)] || 'application/octet-stream','Content-Length':content.length});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found'); }
});
const port = Number(process.env.EQUINORIX_PORT || 4177);
server.listen(port, '127.0.0.1', () => console.log(`EQUINORIX local preview: http://127.0.0.1:${port}`));
