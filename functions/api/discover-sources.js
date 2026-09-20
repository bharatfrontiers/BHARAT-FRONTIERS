import { json, readJson, safeUrl, requireAdmin } from "./_utils.js";

const TRUSTED = [
  {domain:"gov.in", type:"government"}, {domain:"nic.in", type:"government"},
  {domain:"isro.gov.in", type:"primary"}, {domain:"dst.gov.in", type:"government"},
  {domain:"meity.gov.in", type:"government"}, {domain:"pib.gov.in", type:"government"},
  {domain:"niti.gov.in", type:"government"}, {domain:"education.gov.in", type:"government"},
  {domain:"dos.gov.in", type:"government"}, {domain:"drdo.gov.in", type:"primary"},
  {domain:"csir.res.in", type:"research"}, {domain:"iisc.ac.in", type:"research"},
  {domain:"iit.ac.in", type:"research"}, {domain:"who.int", type:"international"},
  {domain:"un.org", type:"international"}, {domain:"worldbank.org", type:"international"},
  {domain:"oecd.org", type:"international"}, {domain:"wto.org", type:"international"},
  {domain:"nature.com", type:"research"}, {domain:"science.org", type:"research"},
  {domain:"ieee.org", type:"research"}, {domain:"acm.org", type:"research"}
];
function domainInfo(url){try{const h=new URL(url).hostname.toLowerCase().replace(/^www\./,'');return TRUSTED.find(x=>h===x.domain||h.endsWith('.'+x.domain))||null}catch{return null}}
function strip(html=''){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000)}
function meta(html,name){const r=new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,'i');return html.match(r)?.[1]||''}
async function inspect(url){
 const valid=safeUrl(url); if(!valid)return null; const info=domainInfo(valid); if(!info)return null;
 try{const r=await fetch(valid,{redirect:'follow',headers:{'User-Agent':'BHARAT-FRONTIERS/1.0 source-verifier'}}); if(!r.ok)return null; const ct=r.headers.get('content-type')||''; if(!ct.includes('text/html'))return null; const html=await r.text();
 const final=r.url||valid; const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()||meta(html,'og:title')||final;
 const description=meta(html,'description')||meta(html,'og:description'); const published=meta(html,'article:published_time')||meta(html,'date');
 return {title,description,excerpt:strip(html),url:final,publisher:info.domain,source_type:info.type,verified:1,published_at:published,retrieved_at:new Date().toISOString()};
 }catch{return null}
}
export async function onRequestOptions(){return json({ok:true})}
export async function onRequestPost(context){const auth=requireAdmin(context.request,context.env);if(!auth.ok)return auth.response;const body=await readJson(context.request);const urls=Array.isArray(body.urls)?body.urls:[];const topic=String(body.topic||'').trim();let candidates=urls.filter(Boolean);
 if(topic){
  const feed=`https://news.google.com/rss/search?q=${encodeURIComponent(topic+' India')}&hl=en-IN&gl=IN&ceid=IN:en`;
  try{const rr=await fetch(feed,{headers:{'User-Agent':'BHARAT-FRONTIERS/1.0'}});const xml=await rr.text();const items=[...xml.matchAll(/<item>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi)].map(m=>m[1].trim());candidates.push(...items.slice(0,12))}catch{}
 }
 const sources=[]; for(const u of [...new Set(candidates)].slice(0,15)){if(u.startsWith('https://www.google.com/search'))continue;const s=await inspect(u);if(s)sources.push(s)}
 return json({ok:true,topic,sources:sources.slice(0,10),message:sources.length?'Verified source candidates returned.':'No verified source URLs were supplied; provide primary-source URLs or use the topic discovery workflow.'});}
