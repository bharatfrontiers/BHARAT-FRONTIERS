import { json, readJson, safeUrl, requireAdmin } from "./_utils.js";
const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
function id(){return crypto.randomUUID()}
function cleanHtml(s=''){return String(s).replace(/<script[\s\S]*?<\/script>/gi,'').trim()}
function slugify(s){return String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)}
async function verify(url){try{const u=safeUrl(url);if(!u)return null;const r=await fetch(u,{redirect:'follow',headers:{'User-Agent':'BHARAT-FRONTIERS/1.0'}});if(!r.ok)return null;const ct=r.headers.get('content-type')||'';if(!ct.includes('text/html'))return null;const html=await r.text();const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()||u;const text=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,14000);return {url:r.url||u,title,excerpt:text};}catch{return null}}
export async function onRequestOptions(){return json({ok:true})}
export async function onRequestPost(context){
 const auth=requireAdmin(context.request,context.env);if(!auth.ok)return auth.response;
 const body=await readJson(context.request);const topic=String(body.topic||'').trim();if(!topic)return json({error:'topic is required'},400);if(!context.env.AI)return json({error:'Workers AI binding AI is not configured'},503);if(!context.env.DB)return json({error:'D1 binding DB is not configured'},503);
 let sources=Array.isArray(body.sources)?body.sources:[];const verified=[];for(const s of sources.slice(0,8)){const v=await verify(s.url);if(v)verified.push({...s,...v,verified:1,retrieved_at:new Date().toISOString()})}
 if(!verified.length)return json({error:'At least one reachable source URL is required. Use the source discovery endpoint first.'},400);
 const evidence=verified.map((s,i)=>`SOURCE ${i+1}\nTITLE: ${s.title}\nURL: ${s.url}\nPUBLISHER: ${s.publisher||''}\nEVIDENCE:\n${s.excerpt}`).join('\n\n').slice(0,60000);
 const prompt=`You are the editorial AI for BHARAT FRONTIERS — The Knowledge Post. Write an original, neutral, evidence-led article about: ${topic}. Use ONLY the supplied source evidence for factual claims. Do not invent facts, numbers, quotations, events or citations. If a claim cannot be supported by the evidence, omit it. Return JSON only with: title, subtitle, summary, content_html, sources_used. content_html must contain an introduction and useful section headings in <h2>, with paragraphs in <p>. Insert source markers like [1], [2] immediately after supported factual claims. sources_used must be an array of source numbers used.\n\n${evidence}`;
 const result=await context.env.AI.run(MODEL,{messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}]});
 let out;try{out=typeof result==='string'?JSON.parse(result):JSON.parse(result.response||result.output||JSON.stringify(result));}catch{return json({error:'AI returned invalid JSON',raw:result},502)}
 if(!out?.title||!out?.content_html||!Array.isArray(out?.sources_used)||!/[\[]\d+[\]]/.test(String(out.content_html))) return json({error:'AI output failed the source-backed publication gate'},422);
 const markerNums=[...String(out.content_html).matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1]));
 if(markerNums.some(n=>n<1||n>verified.length)) return json({error:'AI output contains an invalid source marker'},422);
 const articleId=id(), slug=slugify(out.title||topic)+'-'+articleId.slice(0,8), now=new Date().toISOString();
 const sourceRows=verified.map((s,i)=>({id:id(),article_id:articleId,title:s.title,publisher:s.publisher||'',url:s.url,published_at:s.published_at||null,retrieved_at:s.retrieved_at||now,source_type:s.source_type||'web',verified:1}));
 await context.env.DB.prepare(`INSERT INTO articles (id,slug,title,section,type,author,published_at,summary,image,content_html,status,featured,issue,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(articleId,slug,out.title||topic,String(body.section||'technology'),String(body.type||'feature'),'BHARAT FRONTIERS Editorial Desk',null,out.summary||out.subtitle||'',body.image||'',cleanHtml(out.content_html||''),'draft',0,body.issue||null,now,now).run();
 for(const s of sourceRows)await context.env.DB.prepare(`INSERT INTO sources (id,article_id,title,publisher,url,published_at,retrieved_at,source_type,verified) VALUES (?,?,?,?,?,?,?,?,?)`).bind(s.id,s.article_id,s.title,s.publisher,s.url,s.published_at,s.retrieved_at,s.source_type,s.verified).run();
 return json({ok:true,article:{id:articleId,slug,title:out.title||topic,summary:out.summary||'',content_html:cleanHtml(out.content_html||''),status:'draft',sources:sourceRows}});
}
