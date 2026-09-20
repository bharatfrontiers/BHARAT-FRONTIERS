const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,X-Admin-Key","Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS"};
export function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{"content-type":"application/json; charset=utf-8",...CORS}})}
export function safeUrl(value){try{const u=new URL(String(value));return ["http:","https:"].includes(u.protocol)?u.href:null}catch{return null}}
export async function readJson(request){try{return await request.json()}catch{return {}}}
export function slugify(s=""){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)}
export function cleanText(s=""){return String(s).replace(/\s+/g," ").trim()}
export function htmlEscape(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
export function requireAdmin(request,env){
  const configured=env.ADMIN_KEY;
  if(!configured) return {ok:false,response:json({error:"ADMIN_KEY is not configured. Add it as a Cloudflare secret before using editorial APIs."},503)};
  const supplied=request.headers.get("X-Admin-Key")||"";
  if(supplied!==configured) return {ok:false,response:json({error:"Unauthorized"},401)};
  return {ok:true};
}
export function hostOf(url){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,"")}catch{return ""}}
export function isAllowedHost(url,allowlist){const h=hostOf(url);return allowlist.some(d=>h===d||h.endsWith("."+d))}
export function sourceTypeForHost(host,primaryDomains){return primaryDomains.some(d=>host===d||host.endsWith("."+d))?"primary":"reputable"}
export async function fetchSource(url){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),9000);
  try{
    const r=await fetch(url,{redirect:"follow",signal:controller.signal,headers:{"user-agent":"BHARAT-FRONTIERS-ResearchBot/1.0 (+editorial verification)"}});
    const finalUrl=r.url||url;
    const type=(r.headers.get("content-type")||"").toLowerCase();
    const body=type.includes("text/")||type.includes("html")?await r.text():"";
    return {ok:r.ok,status:r.status,url:finalUrl,contentType:type,body};
  }catch(e){return {ok:false,status:0,url,contentType:"",body:"",error:String(e.message||e)}}finally{clearTimeout(timer)}
}
export function extractPage(url,html){
  const meta=(name)=>{const re=new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,`i`);return (html.match(re)||[])[1]||""};
  const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)||[])[1]||url;
  const title=(meta("og:title")||meta("twitter:title")||(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"").replace(/\s+/g," ").trim();
  const description=(meta("og:description")||meta("description")||"").replace(/\s+/g," ").trim();
  const articleMatch=html.match(/<article[\s\S]*?<\/article>/i);
  let text=(articleMatch?articleMatch[0]:html).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<noscript[\s\S]*?<\/noscript>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g," ").trim();
  return {title,description,canonical,text:text.slice(0,12000)};
}
export function parseJsonFromModel(result){
  const raw=typeof result==="string"?result:(result?.response||result?.result||result?.text||JSON.stringify(result));
  const fenced=raw.match(/```json\s*([\s\S]*?)```/i)||raw.match(/```\s*([\s\S]*?)```/i);
  const candidate=(fenced?fenced[1]:raw).trim();
  const start=candidate.indexOf("{"); const end=candidate.lastIndexOf("}");
  if(start<0||end<start) throw new Error("AI did not return JSON");
  return JSON.parse(candidate.slice(start,end+1));
}
export function renderBlocks(blocks,sources){
  const valid=new Set(sources.map((_,i)=>String(i+1)));
  return (Array.isArray(blocks)?blocks:[]).map((b,i)=>{
    const text=cleanText(b?.text||""); if(!text) return "";
    const ids=[...(b?.source_ids||[])].map(String).filter(x=>valid.has(x));
    const refs=ids.length?` <sup class="source-markers">${ids.map(x=>`<a href="#source-${x}">[${x}]</a>`).join(" ")}</sup>`:"";
    return `<p>${htmlEscape(text)}${refs}</p>`;
  }).join("\n");
}
