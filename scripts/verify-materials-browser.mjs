// Production browser evidence for issue #20/#23. All material captures use
// identical BTM sector, weapon, head pose and camera. No mock renderer, synthetic
// pixel art or claims about physical Quest frame pacing.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const output=process.env.BTM_MATERIALS_OUTPUT||'docs/equipment/ci/materials',port=5188;
await mkdir(output+'/screenshots',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','--port',String(port)],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
const styles=['retro','industrial','cyberpunk','horror','corporate','matrix-facility'];
const screenshots=[],errors=[],evidence=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,
  args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:1470,height:970},deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/immersive-next-qa.html');
 await page.waitForFunction(()=>typeof window.previewMaterial==='function');
 for(const style of styles){
  const result=await page.evaluate(style=>window.previewMaterial({style,sector:0,quality:'high'}),style);
  assert(result.pass,'Production stereo rendering failed: '+style);
  assert.equal(result.textureStyle,style);
  assert.equal(result.authoredTextures,style==='retro'?0:8,
   'Eight local first-party images must load before proof is captured: '+style);
  assert(result.lit>100&&result.leftHash!==result.rightHash,'Distinct, legible stereo views '+style);
  const file=output+'/screenshots/'+style+'-stereo.png',image=await page.locator('#world').screenshot({path:file});
  assert(image.length>2048&&image.subarray(0,8).toString('hex')==='89504e470d0a1a0a');
  const digest=createHash('sha256').update(image).digest('hex');
  evidence.push({style,sector:1,quality:'high',...result,pngSha256:digest,pngBytes:image.length,file});
  screenshots.push({style,bytes:image.toString('base64')});
 }
 const signatures=new Set(evidence.map(row=>row.pngSha256));
 assert.equal(signatures.size,styles.length,
  'Six actual production material styles must produce six distinct stereo images');
 assert.deepEqual(errors,[],'No production page JavaScript errors');
 const contact=await context.newPage();
 await contact.setViewportSize({width:1600,height:1550});
 const html='<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#08101e;color:#fff;font:18px monospace}header{padding:18px 24px}main{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px}figure{margin:0;background:#172132;padding:8px}figcaption{padding:5px 2px 10px}img{width:100%;height:auto;image-rendering:auto}</style><header>BTM / SIX MATERIALS / SAME SECTOR · SAME SYNTHETIC STEREO POSE / REAL PRODUCTION WEBGL</header><main>'+
 screenshots.map(item=>'<figure><figcaption>'+item.style.toUpperCase()+'</figcaption><img src="data:image/png;base64,'+item.bytes+'"></figure>').join('')+'</main>';
 await contact.setContent(html);
 await contact.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 const comparison=output+'/material-six-style-comparison.png';
 await contact.screenshot({path:comparison,fullPage:true});
 const report={passed:true,styles:styles.length,distinctRenderedImages:signatures.size,
  screenshots:evidence,comparison,errors,
  method:'Actual production BTM native WebGL rendered six selected local materials under identical synthetic stereo poses; texture loads finished before capture. No physical Quest 3/3S performance/legibility measurement or user-tested contrast signoff.'};
 await writeFile(output+'/material-proof.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:true,styles:report.styles,distinctRenderedImages:report.distinctRenderedImages,evidence:evidence.map(({style,pngBytes,authoredTextures,lit})=>({style,pngBytes,authoredTextures,lit})),comparison,errors},null,2));
}finally{await browser?.close();server.kill();}
