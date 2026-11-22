import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site-copy/assets/fonts');
await fs.mkdir(root,{recursive:true});
function curl(url) {
  const result=spawnSync('curl.exe',['--silent','--show-error','--location','--max-time','35','--user-agent','Mozilla/5.0',url],{windowsHide:true,maxBuffer:10000000});
  if(result.status!==0)throw new Error('Font download failed: '+result.stderr.toString());
  return result.stdout;
}
let css=curl('https://fonts.googleapis.com/css2?family=Manrope:wght@400..700&display=swap').toString();
let count=0;
for(const source of new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m=>m[1]))) {
  const ext=new URL(source).pathname.split('.').pop();
  const file='manrope-'+(++count)+'.'+ext;
  await fs.writeFile(path.join(root,file),curl(source));
  css=css.replaceAll(source,'/assets/fonts/'+file);
}
if(!count)throw new Error('No font assets discovered');
await fs.writeFile(path.join(root,'manrope.css'),css);
console.log(`Downloaded ${count} local font subsets.`);
