import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'site-copy');
const port=Number(process.env.EQUINORIX_PORT || 4177);
const base=`http://127.0.0.1:${port}`;
let checks=0;
for(const [language,route] of Object.entries({en:'/',es:'/es/',uk:'/uk/',ru:'/ru/'})) {
  const response=await fetch(base+route);
  assert.equal(response.status,200); checks++;
  const html=await response.text();
  const localHtml=await fs.readFile(path.join(root,language==='en'?'':language,'index.html'),'utf8');
  assert.equal(html,localHtml,`${route}: server must serve this design copy`); checks++;
  assert.ok(html.includes(`<html lang="${language}"`));
  assert.equal([...html.matchAll(/\bclass="([^"]*)"/g)].filter(match=>match[1].split(/\s+/).includes('services__item')).length,6);
  assert.ok(!html.includes('undefined'));
  const anchors=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
  for(const match of html.matchAll(/(?:href|src)="([^"#]+|#[^"]+)"/g)) {
    const value=match[1];
    if(value.startsWith('#')) { assert.ok(anchors.has(value.slice(1)),value);checks++;continue; }
    if(!value.startsWith('/')) continue;
    const resource=await fetch(base+value);
    assert.equal(resource.status,200,`${route}: ${value}`); checks++;
  }
}
const checkedCss=new Set();
async function checkCss(file) {
  if(checkedCss.has(file))return;
  checkedCss.add(file);
  const css=await fs.readFile(path.join(root,file),'utf8');
  const response=await fetch(base+'/'+file);
  assert.equal(response.status,200,file); checks++;
  assert.equal(await response.text(),css,`${file}: server must serve this design copy`); checks++;
  for(const match of css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g)) {
    const assetUrl=new URL(match[1],base);
    if(assetUrl.pathname.endsWith('.css'))await checkCss(assetUrl.pathname.slice(1));
    else { assert.equal((await fetch(assetUrl)).status,200,match[1]); checks++; }
  }
}
for(const file of ['assets/styles.css','assets/design.css','assets/design-sections.css','assets/fonts/manrope.css'])await checkCss(file);
const post=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Local QA',email:'qa@example.com',company:'Preview',message:'No external delivery'})});
assert.equal(post.status,503);
assert.deepEqual(await post.json(),{success:false,code:'EMAIL_NOT_CONFIGURED'});checks++;
for(const route of ['/original/site/mail.php','/mail.php','/ftp-read.mjs','/%2e%2e%2foriginal/site/mail.php']) {
  assert.equal((await fetch(base+route)).status,404,route);checks++;
}
console.log(JSON.stringify({passed:true,checks,languages:4,serviceCardsPerPage:6,contactDelivery:'disabled for local preview',privateBackup:'not served'},null,2));
