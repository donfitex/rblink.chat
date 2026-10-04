// AI assistant: works with any OpenAI-compatible endpoint. Free options: Groq, Google Gemini (OpenAI mode), OpenRouter free models, local Ollama.
export default function(R,{send,json}){
 const BASE=process.env.AI_BASE_URL,KEY=process.env.AI_API_KEY||'',MODEL=process.env.AI_MODEL,hits=new Map();
 const SYS='You are the rblink.chat assistant. Help members write posts, draft job descriptions and market listings, summarize text, translate, brainstorm and answer questions. Be concise and friendly.';
 R['GET /api/ai/status']=(q,s)=>send(s,200,{enabled:!!(BASE&&MODEL)});
 R['POST /api/ai']=async(q,s,u)=>{
  if(!BASE||!MODEL)return send(s,501,{error:'The AI assistant is not configured yet. The admin must set AI_BASE_URL, AI_API_KEY and AI_MODEL.'});
  const n=Date.now(),h=(hits.get(u.id)||[]).filter(t=>n-t<6e4);h.push(n);hits.set(u.id,h);if(h.length>20)return send(s,429,{error:'Slow down a little: 20 questions per minute'});
  const{messages}=await json(q),m=(Array.isArray(messages)?messages:[]).filter(x=>['user','assistant'].includes(x?.role)&&typeof x.content==='string').slice(-20).map(x=>({role:x.role,content:x.content.slice(0,4000)}));
  if(!m.length||m[m.length-1].role!=='user')return send(s,400,{error:'Ask a question first'});
  try{const r=await fetch(BASE.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',...(KEY?{Authorization:'Bearer '+KEY}:{})},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYS},...m],max_tokens:800}),signal:AbortSignal.timeout(30000)});
   const j=await r.json().catch(()=>({}));if(!r.ok)return send(s,502,{error:'The AI provider returned an error. Try again shortly.'});send(s,200,{reply:j.choices?.[0]?.message?.content||''})}
  catch{send(s,504,{error:'The AI provider took too long to answer'})}};
}
