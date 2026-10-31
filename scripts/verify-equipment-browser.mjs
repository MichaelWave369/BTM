// Optional author/CI tooling; no Playwright or browser package ships to players.
import {createRequire} from 'node:module';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),out=process.env.BTM_EQUIPMENT_OUTPUT||'docs/equipment/ci',baseline=process.env.BTM_EQUIPMENT_BASELINE||'4ada1488d1d80b4fda6398d642c136060f59ff75',servers=[];
await mkdir(out+'/screenshots',{recursive:true});const temp=await mkdtemp(path.join(tmpdir(),'btm-equipment-'));let browser,worktree=false;
const results={baseline,method:'Actual production Canvas/WebGL from baseline and candidate, identical synthetic poses. No physical Quest/Touch, comfort or frame rate proof.',captures:[],pageErrors:[]};
function start(cwd,port){const p=spawn(process.execPath,['scripts/serve.mjs','--port',String(port)],{cwd,stdio:['ignore','pipe','inherit']});servers.push(p);return new Promise((resolve,reject)=>{p.stdout.once('data',resolve);p.once('error',reject);});}
try{
 execFileSync('git',['worktree','add','--detach',temp,baseline],{stdio:'pipe'});worktree=true;
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:temp,stdio:'pipe'});await copyFile('public/equipment-qa.html',path.join(temp,'dist/equipment-qa.html'));
 await start(root,5176);await start(temp,5177);
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 results.browser=browser.version();const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:5176/equipment-qa.html');await page.locator('#checks').click();await page.waitForFunction(()=>document.querySelector('#raw').textContent.length>0);results.equipment=JSON.parse(await page.locator('#raw').textContent());
 const photos={};
 async function capture(build,config,name){
  await page.goto('http://127.0.0.1:'+(build==='before'?5177:5176)+'/equipment-qa.html');
  const state=await page.evaluate(config=>window.showEquipment(config),config);const file=out+'/screenshots/'+build+'-'+name+'.png';
  await page.locator('#world').screenshot({path:file});const bytes=await readFile(file);photos[build+'-'+name]='data:image/png;base64,'+bytes.toString('base64');
  if(build==='after'&&name==='wrist'){await page.locator('#wrist').screenshot({path:out+'/screenshots/wrist-panel.png'});}
  if(build==='after'&&name==='dialogue'){await page.locator('#comm').screenshot({path:out+'/screenshots/ori-comms.png'});}
  results.captures.push({build,name,...state,pass:state.glError===0&&state.lit>100&&state.leftHash!==state.rightHash&&state.stats.entities.dropped===0});
  const disposed=await page.evaluate(()=>window.disposeEquipment());results.captures.at(-1).liveResourcesAfterDispose=disposed.liveResources;if(disposed.liveResources!==0)throw Error('Leaked GL resources: '+disposed.liveResources);
 }
 for(const build of ['before','after']){
  await capture(build,{pose:'hands',weapon:0,equipmentOnly:true},'hands');
  for(let weapon=1;weapon<6;weapon++)await capture(build,{pose:'hands',weapon,equipmentOnly:true},'weapon-'+weapon);
  await capture(build,{pose:'combat',weapon:1},'combat');await capture(build,{pose:'wrist',weapon:1},'wrist');await capture(build,{pose:'dialogue',weapon:1},'dialogue');
 }
 for(const style of ['neon','tactical'])await capture('after',{pose:'hands',weapon:0,equipmentOnly:true,style},'hands-'+style);
 await capture('after',{pose:'wrist',weapon:1,posture:'standing'},'wrist-standing');
 await capture('after',{pose:'wrist',weapon:1,leftRoll:180,pin:true},'wrist-inverted');
 await capture('after',{pose:'wrist',weapon:1,leftRoll:70,leftPitch:-30,pin:true},'wrist-tilted');
 // Contacts combine only actual rendered captures; they are not concept mockups.
 const gallery=await context.newPage();
 async function contact(file,rows){
  await gallery.setViewportSize({width:1280,height:rows.length*390+70});
  await gallery.setContent('<style>body{margin:0;background:#07111e;color:#e9faff;font:18px monospace}header{height:60px;box-sizing:border-box;padding:18px;color:#53e8ff}section{height:390px;display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}figcaption{height:27px;padding:4px 12px;box-sizing:border-box}img{width:100%;height:355px;object-fit:contain}</style><header>BTM / ACTUAL PRODUCTION RENDER / SYNTHETIC POSES</header>'+rows.map(([before,after,label])=>'<section><figure><figcaption>BEFORE / '+label+'</figcaption><img src="'+photos[before]+'"></figure><figure><figcaption>UPGRADED / '+label+'</figcaption><img src="'+photos[after]+'"></figure></section>').join(''));
  await gallery.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await gallery.screenshot({path:out+'/'+file,type:'jpeg',quality:86,fullPage:true});
 }
 await contact('hands-comparison.jpg',[['before-hands','after-hands','Cybernetic gloves / detail pose']]);
 await contact('weapons-comparison.jpg',Array.from({length:5},(_,i)=>['before-weapon-'+(i+1),'after-weapon-'+(i+1),['Resonance Blaster','Bass Cannon','Φ Pulse Rifle','Altermath Disruptor','The Unplugger'][i]]));
 await contact('wrist-dialogue-comparison.jpg',[['before-combat','after-combat','Ordinary combat / wrist inactive'],['before-wrist','after-wrist','Intentional wrist activation'],['before-dialogue','after-dialogue','Ori communication']]);
 // Actual DOM settings persistence and existing v1 key.
 await page.goto('http://127.0.0.1:5176/');await page.locator('#title-settings').click();await page.selectOption('#vrHandStyle','tactical');
 await page.locator('#vrWristSize').evaluate(el=>{el.value='.36';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.selectOption('#vrSubtitleMode','ori');await page.reload();await page.locator('#title-settings').click();
 const preferences={style:await page.locator('#vrHandStyle').inputValue(),width:await page.locator('#vrWristSize').inputValue(),subtitles:await page.locator('#vrSubtitleMode').inputValue()};results.settings={passed:preferences.style==='tactical'&&Number(preferences.width)===.36&&preferences.subtitles==='ori',values:preferences};
 const combat=results.captures.find(c=>c.build==='after'&&c.name==='combat'),active=results.captures.find(c=>c.build==='after'&&c.name==='wrist');
 results.behavior={passed:!combat.wristOpen&&active.wristOpen&&active.wristWidth<=.33&&active.wristHeight<.23,combatPanelVisible:combat.wristOpen,activeWidth:active.wristWidth,activeHeight:active.wristHeight};
 results.passed=results.equipment.passed&&results.captures.every(c=>c.pass)&&results.settings.passed&&results.behavior.passed&&!results.pageErrors.length;
 await writeFile(out+'/report.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({passed:results.passed,equipment:results.equipment,captures:results.captures.map(c=>({build:c.build,name:c.name,pass:c.pass,wristOpen:c.wristOpen})),settings:results.settings,behavior:results.behavior,pageErrors:results.pageErrors},null,2));if(!results.passed)process.exitCode=1;
}finally{await browser?.close();for(const p of servers)p.kill();if(worktree)execFileSync('git',['worktree','remove','--force',temp],{stdio:'pipe'});}
