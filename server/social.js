// Profiles (with protected WhatsApp), posts, comments, reactions, saves, reshares, reports.
import crypto from 'crypto';
export const CATEGORIES=['news','updates','sports','tech','education','entertainment','business','health','lifestyle','other'];
const SOC=['github','portfolio','linkedin','instagram','facebook','x','telegram','youtube','tiktok','whatsapp'];
export default function(R,c){
 const{db,flush,save,send,json,wsSend,clients}=c,id=p=>p+'_'+crypto.randomBytes(6).toString('hex');
 for(const k of['posts','comments','waReq','reports'])db[k]??=[];
 const open=(k,f)=>{f.open=true;R[k]=f},isAdmin=u=>u&&(u.role==='owner'||u.role==='admin'),str=(v,n)=>String(v??'').trim().slice(0,n);
 const user=i=>db.users.find(x=>x.id===i),au=i=>{const x=user(i);return x?{id:x.id,name:x.name,avatar:x.avatar||'',verified:!!x.verified}:{id:i,name:'Deleted user',avatar:''}};
 const media=a=>(Array.isArray(a)?a:[]).slice(0,30).filter(m=>m&&/^\/uploads\/[\w.-]+$/.test(m.url)&&['image','video'].includes(m.type)).map(m=>({url:m.url,type:m.type,name:str(m.name,80)}));
 const social=v=>{const o={};for(const k of SOC){let x=str(v?.[k],200);if(!x)continue;if(k==='whatsapp')x=x.replace(/[^\d+]/g,'').slice(0,20);else if(!/^https?:\/\//i.test(x)&&!/^@?[\w.\-]{1,60}$/.test(x))x=/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(x)?'https://'+x:'';if(x)o[k]=x}return o};
 // ----- profiles
 const view=(t,v)=>{const self=v&&v.id===t.id,r=db.waReq.find(x=>x.from===v?.id&&x.to===t.id),soc={...(t.socials||{})},wa=soc.whatsapp;delete soc.whatsapp;
  return{id:t.id,name:t.name,avatar:t.avatar||'',role:t.role,verified:!!t.verified,recruiter:!!t.recruiter,headline:t.headline||'',bio:t.bio||'',location:t.location||'',joinedAt:t.createdAt,socials:soc,
   whatsapp:self||r?.status==='approved'?wa||null:null,hasWhatsapp:!!wa,waStatus:self?'self':r?r.status:'none',posts:db.posts.filter(p=>p.authorId===t.id).length}};
 R['GET /api/me/profile']=(q,s,u)=>send(s,200,{...view(u,u),email:u.email||'',phone:u.phone||'',socials:u.socials||{}});
 R['PATCH /api/me/profile']=async(q,s,u)=>{const b=await json(q);
  if(b.name!==undefined){const n=str(b.name,60);if(!n)return send(s,400,{error:'Name cannot be empty'});u.name=n}
  for(const[k,n]of[['headline',80],['bio',500],['location',80]])if(b[k]!==undefined)u[k]=str(b[k],n);
  if(b.avatar!==undefined){if(b.avatar&&!/^\/uploads\/[\w.-]+$/.test(b.avatar))return send(s,400,{error:'Upload the avatar first'});u.avatar=b.avatar}
  if(b.socials)u.socials=social(b.socials);flush();send(s,200,{ok:true})};
 open('GET /api/users',(q,s,u,P,url)=>{const t=(url.searchParams.get('q')||'').toLowerCase();
  send(s,200,db.users.filter(x=>!t||x.name.toLowerCase().includes(t)).slice(0,200).map(x=>u?{id:x.id,name:x.name,avatar:x.avatar||'',role:x.role,headline:x.headline||'',location:x.location||'',verified:!!x.verified}:{id:x.id,name:x.name,avatar:x.avatar||''}))});
 R['GET /api/users/:id']=(q,s,u,P)=>{const t=user(P.id);t?send(s,200,view(t,u)):send(s,404,{error:'User not found'})};
 R['POST /api/users/:id/whatsapp-request']=(q,s,u,P)=>{const t=user(P.id);if(!t||t.id===u.id)return send(s,400,{error:'Invalid request'});
  if(!t.socials?.whatsapp)return send(s,400,{error:'This user has not added WhatsApp'});
  let r=db.waReq.find(x=>x.from===u.id&&x.to===t.id);if(r&&r.status!=='denied')return send(s,200,{status:r.status});
  if(r)r.status='pending';else db.waReq.push(r={id:id('wa'),from:u.id,to:t.id,status:'pending',at:Date.now()});flush();send(s,200,{status:'pending'})};
 R['GET /api/whatsapp-requests']=(q,s,u)=>send(s,200,db.waReq.filter(x=>x.to===u.id&&x.status==='pending').map(x=>({id:x.id,from:au(x.from),at:x.at})));
 R['POST /api/whatsapp-requests/:id']=async(q,s,u,P)=>{const r=db.waReq.find(x=>x.id===P.id&&x.to===u.id);if(!r)return send(s,404,{error:'Not found'});r.status=(await json(q)).approve?'approved':'denied';flush();send(s,200,{status:r.status})};
 // ----- posts
 const hp=(p,u,deep=true)=>({id:p.id,authorId:p.authorId,author:au(p.authorId),text:p.text,category:p.category,media:p.media,reshareOf:p.reshareOf,original:deep&&p.reshareOf?(db.posts.find(x=>x.id===p.reshareOf)?hp(db.posts.find(x=>x.id===p.reshareOf),u,false):{deleted:true}):null,
  createdAt:p.createdAt,shares:p.shares||0,reactionCounts:Object.fromEntries(Object.entries(p.reactions).map(([e,a])=>[e,a.length])),myReaction:u&&Object.entries(p.reactions).find(([,a])=>a.includes(u.id))?.[0]||null,
  saved:!!u&&p.saves.includes(u.id),saveCount:p.saves.length,commentCount:db.comments.filter(x=>x.postId===p.id).length,reshareCount:db.posts.filter(x=>x.reshareOf===p.id).length});
 open('GET /api/categories',(q,s)=>send(s,200,CATEGORIES));
 open('GET /api/posts',(q,s,u,P,url)=>{const g=k=>url.searchParams.get(k)||'',cat=g('category'),au_=g('author'),tab=g('tab'),t=g('q').toLowerCase(),before=g('before'),lim=Math.min(+g('limit')||20,50);
  if(tab==='saved'&&!u)return send(s,401,{error:'Please log in'});
  let l=db.posts.filter(p=>(!cat||p.category===cat)&&(!au_||p.authorId===au_)&&(!t||p.text.toLowerCase().includes(t))&&(!before||p.createdAt<before)
   &&(tab==='saved'?p.saves.includes(u.id):tab==='reshared'?!!p.reshareOf:tab==='posts'?!p.reshareOf:true));
  l=l.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,lim);send(s,200,l.map(p=>hp(p,u)))});
 open('GET /api/posts/:id',(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);p?send(s,200,hp(p,u)):send(s,404,{error:'Post not found'})});
 R['POST /api/posts']=async(q,s,u)=>{const b=await json(q),text=str(b.text,5000),m=media(b.media),cat=CATEGORIES.includes(b.category)?b.category:'other';let rs=null;
  if(b.reshareOf){const o=db.posts.find(x=>x.id===b.reshareOf);if(!o)return send(s,404,{error:'Post not found'});rs=o.reshareOf||o.id}
  if(!text&&!m.length&&!rs)return send(s,400,{error:'Write something or add a photo or video'});
  const p={id:id('p'),authorId:u.id,text,category:rs?db.posts.find(x=>x.id===rs).category:cat,media:m,reshareOf:rs,reactions:{},saves:[],shares:0,createdAt:new Date().toISOString()};db.posts.push(p);save();send(s,200,hp(p,u))};
 R['DELETE /api/posts/:id']=(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(!p)return send(s,404,{error:'Not found'});if(p.authorId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  db.posts=db.posts.filter(x=>x!==p&&x.reshareOf!==p.id);db.comments=db.comments.filter(x=>x.postId!==p.id);save();send(s,200,{ok:true})};
 const toggle=(o,u,e)=>{const had=o.reactions[e]?.includes(u.id);for(const k of Object.keys(o.reactions)){o.reactions[k]=o.reactions[k].filter(x=>x!==u.id);if(!o.reactions[k].length)delete o.reactions[k]}if(!had)(o.reactions[e]??=[]).push(u.id)};
 const EMO=new Set(['👍','❤️','😂','😮','😢','🙏','🔥','🎉']);
 R['POST /api/posts/:id/react']=async(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id),{emoji}=await json(q);if(!p||!EMO.has(emoji))return send(s,400,{error:'Invalid'});toggle(p,u,emoji);save();send(s,200,hp(p,u))};
 R['POST /api/posts/:id/save']=(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(!p)return send(s,404,{error:'Not found'});const i=p.saves.indexOf(u.id);i<0?p.saves.push(u.id):p.saves.splice(i,1);save();send(s,200,hp(p,u))};
 open('POST /api/posts/:id/shared',(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(p){p.shares=(p.shares||0)+1;save()}send(s,200,{ok:true})});
 // ----- comments (text, voice, replies, reactions)
 const hc=(x,u)=>({id:x.id,postId:x.postId,parentId:x.parentId,author:au(x.authorId),text:x.text,audio:x.audio,createdAt:x.createdAt,reactionCounts:Object.fromEntries(Object.entries(x.reactions).map(([e,a])=>[e,a.length])),myReaction:u&&Object.entries(x.reactions).find(([,a])=>a.includes(u.id))?.[0]||null});
 open('GET /api/posts/:id/comments',(q,s,u,P)=>send(s,200,db.comments.filter(x=>x.postId===P.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(x=>hc(x,u))));
 R['POST /api/posts/:id/comments']=async(q,s,u,P)=>{const b=await json(q),text=str(b.text,2000),audio=/^\/uploads\/[\w.-]+$/.test(b.audio||'')?b.audio:null;
  if(!db.posts.some(x=>x.id===P.id))return send(s,404,{error:'Post not found'});if(!text&&!audio)return send(s,400,{error:'Write a comment or record a voice note'});
  if(b.parentId&&!db.comments.some(x=>x.id===b.parentId&&x.postId===P.id))return send(s,400,{error:'Reply target not found'});
  const x={id:id('c'),postId:P.id,parentId:b.parentId||null,authorId:u.id,text,audio,reactions:{},createdAt:new Date().toISOString()};db.comments.push(x);save();send(s,200,hc(x,u))};
 R['POST /api/comments/:id/react']=async(q,s,u,P)=>{const x=db.comments.find(y=>y.id===P.id),{emoji}=await json(q);if(!x||!EMO.has(emoji))return send(s,400,{error:'Invalid'});toggle(x,u,emoji);save();send(s,200,hc(x,u))};
 R['DELETE /api/comments/:id']=(q,s,u,P)=>{const x=db.comments.find(y=>y.id===P.id);if(!x)return send(s,404,{error:'Not found'});if(x.authorId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  const gone=new Set([x.id]);let n;do{n=gone.size;db.comments.filter(y=>gone.has(y.parentId)).forEach(y=>gone.add(y.id))}while(gone.size>n);db.comments=db.comments.filter(y=>!gone.has(y.id));save();send(s,200,{ok:true})};
 // ----- reports + public group list
 R['POST /api/report']=async(q,s,u)=>{const b=await json(q);db.reports.push({id:id('r'),by:u.id,type:str(b.type,20),target:str(b.target,60),reason:str(b.reason,500),at:Date.now()});flush();send(s,200,{ok:true})};
 R['GET /api/admin/reports']=(q,s,u)=>isAdmin(u)?send(s,200,db.reports.slice(-100).reverse()):send(s,403,{error:'Admins only'});
 open('GET /api/public/groups',(q,s)=>{let ch=[];try{ch=JSON.parse(db.sync.rblink_channels||'[]')}catch{}send(s,200,ch.filter(x=>!x.isPrivate&&!x.isArchived).map(x=>({id:x.id,name:x.name,description:x.description||'',members:(x.memberIds||[]).length})))});
}
