import {json,readJson,cleanText,requireAdmin} from "./_utils.js";

function validEmail(value=""){
  const email=String(value).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length<=254;
}

function id(){return crypto.randomUUID();}

export async function onRequest(context){
  if(context.request.method==="OPTIONS") return json({ok:true});
  if(!context.env.DB) return json({error:"D1 database binding DB is not configured."},503);

  const url=new URL(context.request.url);

  if(context.request.method==="GET"){
    const slug=cleanText(url.searchParams.get("slug")||"");
    if(!slug) return json({error:"slug is required"},400);

    const admin=requireAdmin(context.request,context.env);
    if(admin.ok && url.searchParams.get("admin")==="1"){
      const rows=await context.env.DB.prepare(`
        SELECT c.id,c.name,c.email,c.kind,c.body,c.status,c.created_at,a.slug,a.title
        FROM comments c JOIN articles a ON a.id=c.article_id
        ORDER BY CASE c.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, c.created_at DESC
        LIMIT 300
      `).all();
      return json({comments:rows.results||[]});
    }

    const article=await context.env.DB.prepare(`
      SELECT id FROM articles WHERE slug=? AND status='published' AND source_gate='verified' LIMIT 1
    `).bind(slug).first();
    if(!article) return json({error:"Article not found"},404);

    const rows=await context.env.DB.prepare(`
      SELECT id,name,kind,body,created_at
      FROM comments WHERE article_id=? AND status='approved'
      ORDER BY created_at ASC LIMIT 100
    `).bind(article.id).all();
    return json({comments:rows.results||[]});
  }

  if(context.request.method!=="POST") return json({error:"Method not allowed"},405);

  const body=await readJson(context.request);

  // Admin moderation actions.
  if(body.action){
    const auth=requireAdmin(context.request,context.env);
    if(!auth.ok) return auth.response;
    const commentId=cleanText(body.id||"");
    const status=cleanText(body.action||"");
    if(!commentId || !["approved","rejected","pending"].includes(status)) return json({error:"Invalid moderation request"},400);
    const now=new Date().toISOString();
    const result=await context.env.DB.prepare("UPDATE comments SET status=?,updated_at=? WHERE id=?").bind(status,now,commentId).run();
    if(!result.meta?.changes) return json({error:"Comment not found"},404);
    return json({ok:true,id:commentId,status});
  }

  // Public submission: email is mandatory for editorial response, but no login or verification is required.
  if(body.website) return json({ok:true,message:"Thank you. Your submission is under review."});

  const slug=cleanText(body.slug||"");
  const name=cleanText(body.name||"").slice(0,100);
  const email=cleanText(body.email||"").toLowerCase().slice(0,254);
  const kind=cleanText(body.kind||"comment").toLowerCase();
  const message=String(body.body||"").trim().slice(0,4000);

  if(!slug || !name || !email || !message) return json({error:"Name, e-mail and comment/query are required."},400);
  if(!validEmail(email)) return json({error:"Please enter a valid e-mail address."},400);
  if(!["comment","query"].includes(kind)) return json({error:"Invalid submission type."},400);
  if(message.length<5) return json({error:"Please provide a little more detail."},400);

  const article=await context.env.DB.prepare(`
    SELECT id FROM articles WHERE slug=? AND status='published' AND source_gate='verified' LIMIT 1
  `).bind(slug).first();
  if(!article) return json({error:"Comments are available only for published, source-verified articles."},404);

  // Lightweight abuse control without exposing the reader's e-mail publicly.
  const recent=await context.env.DB.prepare(`
    SELECT id FROM comments WHERE article_id=? AND email=? AND created_at >= datetime('now','-10 minutes') LIMIT 1
  `).bind(article.id,email).first();
  if(recent) return json({error:"Please wait a few minutes before submitting another message."},429);

  const now=new Date().toISOString();
  await context.env.DB.prepare(`
    INSERT INTO comments(id,article_id,name,email,kind,body,status,created_at,updated_at)
    VALUES(?,?,?,?,?,'pending',?,?,?)
  `).bind(id(),article.id,name,email,kind,message,now,now).run();

  return json({ok:true,message:"Thank you. Your submission has been received and is awaiting editorial review."},201);
}
