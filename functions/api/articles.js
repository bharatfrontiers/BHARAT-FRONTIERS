import { json } from "./_utils.js";

export async function onRequestGet(context){
  if(!context.env.DB) return json({error:"D1 binding DB is not configured"},503);
  const u=new URL(context.request.url);
  const slug=u.searchParams.get("slug");
  const status=u.searchParams.get("status")||"published";

  if(slug){
    const article=await context.env.DB.prepare(
      `SELECT * FROM articles WHERE slug=? AND status=? AND source_gate='verified'`
    ).bind(slug,status).first();
    if(!article) return json({error:"Article not found or source verification is incomplete"},404);

    const src=await context.env.DB.prepare(
      `SELECT title,publisher,url,published_at,retrieved_at,source_type,verified
       FROM sources WHERE article_id=? AND verified=1 ORDER BY retrieved_at`
    ).bind(article.id).all();

    const related=await context.env.DB.prepare(
      `SELECT id,slug,title,section,type,summary,published_at
       FROM articles
       WHERE status='published' AND source_gate='verified' AND section=? AND id<>?
       ORDER BY published_at DESC LIMIT 6`
    ).bind(article.section,article.id).all();

    let moreInfo=[];
    try{moreInfo=JSON.parse(article.more_info_json||"[]")}catch{}
    return json({article:{...article,more_info:moreInfo,sources:src.results||[]},related:related.results||[]});
  }

  const rows=await context.env.DB.prepare(
    `SELECT id,slug,title,section,type,author,published_at,summary,image,status,featured,issue
     FROM articles WHERE status=? AND source_gate='verified'
     ORDER BY published_at DESC LIMIT 100`
  ).bind(status).all();

  return json({articles:rows.results||[]});
}
