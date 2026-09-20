import { json, readJson, requireAdmin } from "./_utils.js";
const MODEL="@cf/black-forest-labs/flux-1-schnell";
export async function onRequestOptions(){return json({ok:true})}
export async function onRequestPost(context){
 const auth=requireAdmin(context.request,context.env);if(!auth.ok)return auth.response;
 if(!context.env.AI)return json({error:"Workers AI binding AI is not configured"},503);
 const b=await readJson(context.request);const prompt=String(b.prompt||"").trim();if(!prompt)return json({error:"prompt is required"},400);
 const result=await context.env.AI.run(MODEL,{prompt:prompt.slice(0,2048),steps:4});
 if(!result?.image)return json({error:"Image model returned no image"},502);
 if(!context.env.MEDIA){
   return json({ok:true,persisted:false,data_uri:`data:image/jpeg;base64,${result.image}`,message:"Preview generated. Configure the MEDIA R2 binding to persist monthly article images."});
 }
 const bin=Uint8Array.from(atob(result.image),c=>c.charCodeAt(0));
 const key=`generated/${new Date().toISOString().slice(0,7)}/${crypto.randomUUID()}.jpg`;
 await context.env.MEDIA.put(key,bin,{httpMetadata:{contentType:"image/jpeg"}});
 return json({ok:true,persisted:true,key,url:`/media/${key}`});
}
