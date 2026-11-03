// Explicit trusted browser Origin allowlist for a public BBS node.
// Empty or wildcard values are rejected; callers may supply CLI --origin values.
export function trustedHostOrigins(envValue='',cliValues=[]){
 const values=[...String(envValue).split(','),...cliValues];
 const result=new Set();
 for(const raw of values){
  const value=String(raw).trim();
  if(!value)continue;
  let url;
  try{url=new URL(value);}catch{throw Error('Invalid BTM allowed origin: '+value);}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||
    url.pathname!=='/'||url.search||url.hash||url.origin==='null')
   throw Error('BTM allowed origins must be full HTTP(S) origins: '+value);
  result.add(url.origin);
 }
 return [...result];
}
