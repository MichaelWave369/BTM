import{runPit}from'../tests/pit-playthrough.js';import{mkdir,writeFile}from'node:fs/promises';
const out=process.env.BTM_PIT_OUTPUT||'docs/pit-of-despair';await mkdir(out,{recursive:true});
const report={classic:runPit(),immersive:runPit({immersive:true})};await writeFile(out+'/playthrough.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.classic.passed||!report.immersive.passed)process.exitCode=1;
