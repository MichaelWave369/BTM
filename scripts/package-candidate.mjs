import path from'node:path';import{packageSource}from'./package-source.mjs';
if(!process.argv[2])throw Error('Usage: node scripts/package-candidate.mjs /absolute/output.zip');
const output=path.resolve(process.argv[2]),files=await packageSource(process.cwd(),output,{includeBuildDownload:true});console.log(JSON.stringify({output,files,includesPrebuiltSourceDownload:true}));
