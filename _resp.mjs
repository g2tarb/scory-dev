import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';
const ROOT='/Users/erwinyana/dev/portfolio/dist';
const T={ '.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json' };
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';let f=join(ROOT,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f)){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':T[extname(f)]||'application/octet-stream'});s.end(readFileSync(f));});
await new Promise(r=>srv.listen(4343,r));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
async function shoot(w, tag){
  const pg=await b.newPage({viewport:{width:w,height:820}, reducedMotion:'reduce', isMobile:w<700, hasTouch:w<700});
  await pg.goto('http://localhost:4343/',{waitUntil:'networkidle'});
  await pg.waitForTimeout(400);
  await pg.evaluate(()=>document.querySelector('#builder').scrollIntoView());
  await pg.waitForTimeout(300);
  // header builder (switch + lead) + chips + estim
  await pg.evaluate(()=>{const h=document.querySelector('#builder');window.scrollTo(0, window.scrollY + h.getBoundingClientRect().top - 8);});
  await pg.waitForTimeout(250);
  await pg.screenshot({ path:`/tmp/portfolio-shots/R_${tag}_head.png` });
  // générer site
  await pg.click('.builder-go'); await pg.waitForTimeout(500);
  await (await pg.$('[data-mock]')).screenshot({ path:`/tmp/portfolio-shots/R_${tag}_sitemock.png` });
  // bascule app + generate
  await pg.click('.kind-opt[data-set=app]'); await pg.waitForTimeout(500);
  await (await pg.$('[data-mock]')).screenshot({ path:`/tmp/portfolio-shots/R_${tag}_phone.png` });
  const info = await pg.evaluate(()=>{
    const sw=document.querySelector('.kind-switch').getBoundingClientRect();
    const h2=document.querySelector('#builder h2').getBoundingClientRect();
    return {switchW:Math.round(sw.width), h2H:Math.round(h2.height), h2W:Math.round(h2.width), overflow: document.documentElement.scrollWidth>document.documentElement.clientWidth};
  });
  console.log(tag, JSON.stringify(info));
  await pg.close();
}
await shoot(375,'m');
await shoot(768,'t');
await b.close(); srv.close();
