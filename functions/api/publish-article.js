import { json, readJson, requireAdmin } from "./_utils.js";

export async function onRequestOptions(){return json({ok:true})}

export async function onRequestPost(context){
 const auth=requireAdmin(context.request,context.env);
 if(!auth.ok)return auth.response;
 if(!context.env.DB)return json({error:"D1 binding DB is not configured"},503);
 const b=await readJson(context.request);
 const id=String(b.id||"");
 if(!id)return json({error:"article id required"},400);

 const article=await context.env.DB.prepare(
  `SELECT id,slug,content_html,source_gate,status FROM articles WHERE id=?`
 ).bind(id).first();

 if(!article)return json({error:"Article not found"},404);

 const count=await context.env.DB.prepare(
  `SELECT COUNT(*) AS n FROM sources WHERE article_id=? AND verified=1`
 ).bind(id).first();

 const markerOk=/\[\d+\]/.test(String(article.content_html||""));
 if(article.source_gate!=="verified" || Number(count?.n||0)<1 || !markerOk){
   return json({
     error:"Publication blocked. The article must have verified sources and source markers before publication.",
     source_count:Number(count?.n||0),
     source_gate:article.source_gate||"blocked"
   },422);
 }

 const now=new Date().toISOString();
 const r=await context.env.DB.prepare(
  `UPDATE articles SET status='published', published_at=?, updated_at=? WHERE id=? AND status IN ('draft','review','approved')`
 ).bind(now,now,id).run();

 if(!r.meta?.changes)return json({error:"Article is not in a publishable workflow state"},404);

 return json({ok:true,id,slug:article.slug,status:"published",published_at:now});
}
