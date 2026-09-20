import {json,readJson,requireAdmin,cleanText} from "./_utils.js";
export async function onRequest(context){
  if(context.request.method==="OPTIONS") return json({ok:true});
  const auth=requireAdmin(context.request,context.env); if(!auth.ok) return auth.response;
  if(!context.env.DB) return json({error:"D1 database binding DB is not configured."},503);
  const b=await readJson(context.request); const slug=cleanText(b.slug||""); if(!slug) return json({error:"slug is required"},400);
  const a=await context.env.DB.prepare("SELECT * FROM articles WHERE slug=? LIMIT 1").bind(slug).first(); if(!a) return json({error:"Article not found"},404);
  const title=cleanText(b.title||a.title),summary=cleanText(b.summary||a.summary),content=String(b.content_html??a.content_html),status=cleanText(b.status||a.status),now=new Date().toISOString();
  if(!["draft","review","approved","published","archived"].includes(status)) return json({error:"Invalid status"},400);
  await context.env.DB.prepare("UPDATE articles SET title=?,summary=?,content_html=?,status=?,updated_at=? WHERE id=?").bind(title,summary,content,status,now,a.id).run();
  return json({ok:true,slug,status,updated_at:now});
}
