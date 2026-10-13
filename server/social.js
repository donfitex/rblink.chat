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
 const defaultPrivacy=()=>({searchVisibility:'everyone',messageVisibility:'everyone',allowDirectMessages:true,allowMentions:true,showPresence:true,showEmail:false});
 const ensurePrivacy=u=>{if(!u)return u;u.privacy??={...defaultPrivacy()};u.blockedUserIds??=[];u.mutedUserIds??=[];u.sessions??=[];u.privacy={...defaultPrivacy(),...u.privacy};return u};
 const isContact=(a,b)=>{if(!a||!b||a.id===b.id)return true;const st=db.sync||{};try{const dms=JSON.parse(st.rblink_dms||'[]');return dms.some(x=>(x.participantIds||[]).includes(a.id)&&(x.participantIds||[]).includes(b.id));}catch{return false}};
 const canSeeUser=(viewer,target)=>{if(!viewer||!target)return false;if(target.id===viewer.id)return true;if((viewer.blockedUserIds||[]).includes(target.id))return false;if((target.blockedUserIds||[]).includes(viewer.id))return false;const p=target.privacy||{};const mode=(p.searchVisibility||'everyone');if(mode==='nobody')return false;if(mode==='contacts'&&!isContact(viewer,target))return false;return true};
 const canMessage=(from,to)=>{if(!from||!to)return false;if(from.id===to.id)return false;if((from.blockedUserIds||[]).includes(to.id))return false;if((to.blockedUserIds||[]).includes(from.id))return false;const p=to.privacy||{};const mode=p.messageVisibility||'everyone';if(!p.allowDirectMessages&&mode!=='everyone')return false;if(mode==='nobody')return false;if(mode==='contacts'&&!isContact(from,to))return false;return true};
 const social=v=>{const o={};for(const k of SOC){let x=str(v?.[k],200);if(!x)continue;if(k==='whatsapp')x=x.replace(/[^\d+]/g,'').slice(0,20);else if(!/^https?:\/\//i.test(x)&&!/^@?[\w.\-]{1,60}$/.test(x))x=/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(x)?'https://'+x:'';if(x)o[k]=x}return o};
 // ----- profiles
 const view=(t,v)=>{const self=v&&v.id===t.id,r=db.waReq.find(x=>x.from===v?.id&&x.to===t.id),soc={...(t.socials||{})},wa=soc.whatsapp;delete soc.whatsapp;const privacy=ensurePrivacy(t).privacy;
  return{id:t.id,name:t.name,avatar:t.avatar||'',role:t.role,verified:!!t.verified,recruiter:!!t.recruiter,headline:t.headline||'',bio:t.bio||'',location:t.location||'',joinedAt:t.createdAt,socials:soc,
   whatsapp:self||r?.status==='approved'?wa||null:null,hasWhatsapp:!!wa,waStatus:self?'self':r?r.status:'none',posts:db.posts.filter(p=>p.authorId===t.id).length,privacy:self?{...privacy,blockedUserIds:[...(t.blockedUserIds||[])],mutedUserIds:[...(t.mutedUserIds||[])]}:{...privacy,blockedUserIds:[],mutedUserIds:[]}};
 };
 R['GET /api/me/profile']=(q,s,u)=>send(s,200,{...view(u,u),email:u.email||'',phone:u.phone||'',socials:u.socials||{},privacy:{...ensurePrivacy(u).privacy,blockedUserIds:[...(u.blockedUserIds||[])],mutedUserIds:[...(u.mutedUserIds||[])]}});
 R['PATCH /api/me/profile']=async(q,s,u)=>{const b=await json(q);
  if(b.name!==undefined){const n=str(b.name,60);if(!n)return send(s,400,{error:'Name cannot be empty'});u.name=n}
  for(const[k,n]of[['headline',80],['bio',500],['location',80]])if(b[k]!==undefined)u[k]=str(b[k],n);
  if(b.avatar!==undefined){if(b.avatar&&!/^\/uploads\/[\w.-]+$/.test(b.avatar))return send(s,400,{error:'Upload the avatar first'});u.avatar=b.avatar}
  if(b.socials)u.socials=social(b.socials);flush();send(s,200,{ok:true})};
 R['GET /api/me/privacy']=(q,s,u)=>{const me=ensurePrivacy(u);send(s,200,{privacy:{...me.privacy},blockedUserIds:[...(me.blockedUserIds||[])],mutedUserIds:[...(me.mutedUserIds||[])],sessions:(me.sessions||[]).filter(x=>!x.revoked).map(x=>({id:x.id,device:x.device||'Browser',userAgent:x.userAgent||'Unknown device',ip:x.ip||'',createdAt:x.createdAt||new Date().toISOString(),lastSeen:x.lastSeen||x.createdAt||new Date().toISOString(),revoked:!!x.revoked}))})};
 R['PATCH /api/me/privacy']=async(q,s,u)=>{const me=ensurePrivacy(u),b=await json(q),p=me.privacy||=defaultPrivacy();const al=['searchVisibility','messageVisibility','allowDirectMessages','allowMentions','showPresence','showEmail'];for(const key of al){if(b[key]!==undefined){if(key==='searchVisibility'||key==='messageVisibility'){const v=String(b[key]).toLowerCase();if(['everyone','contacts','nobody'].includes(v))p[key]=v;else return send(s,400,{error:'Invalid privacy value'})}else if(typeof b[key]==='boolean')p[key]=b[key]}};send(s,200,{privacy:{...p}})};
 R['PUT /api/me/privacy']=R['PATCH /api/me/privacy'];
 R['POST /api/users/:id/block']=async(q,s,u,P)=>{const t=user(P.id);if(!t||t.id===u.id)return send(s,400,{error:'Invalid user'});const me=ensurePrivacy(u);const by=me.blockedUserIds||[];me.blockedUserIds=[...new Set(by.includes(t.id)?by.filter(x=>x!==t.id):[...by,t.id])];flush();send(s,200,{blocked:me.blockedUserIds.includes(t.id),blockedUserIds:[...me.blockedUserIds]})};
 R['PUT /api/users/:id/block']=R['POST /api/users/:id/block'];
 R['POST /api/users/:id/mute']=async(q,s,u,P)=>{const t=user(P.id);if(!t||t.id===u.id)return send(s,400,{error:'Invalid user'});const me=ensurePrivacy(u);const by=me.mutedUserIds||[];me.mutedUserIds=[...new Set(by.includes(t.id)?by.filter(x=>x!==t.id):[...by,t.id])];flush();send(s,200,{muted:me.mutedUserIds.includes(t.id),mutedUserIds:[...me.mutedUserIds]})};
 R['PUT /api/users/:id/mute']=R['POST /api/users/:id/mute'];
 open('GET /api/users',(q,s,u,P,url)=>{const t=(url.searchParams.get('q')||'').toLowerCase();
  const list = u ? db.users.filter(x=>canSeeUser(u,x)) : db.users;
  send(s,200,list.filter(x=>!t||x.name.toLowerCase().includes(t)).slice(0,200).map(x=>u?{id:x.id,name:x.name,avatar:x.avatar||'',role:x.role,headline:x.headline||'',location:x.location||'',verified:!!x.verified}:{id:x.id,name:x.name,avatar:x.avatar||''}))});
 R['GET /api/users/:id']=(q,s,u,P)=>{const t=user(P.id);if(!t)return send(s,404,{error:'User not found'});if(!canSeeUser(u,t))return send(s,404,{error:'User not found'});send(s,200,view(t,u))};
 R['GET /api/me/sessions']=(q,s,u)=>{const me=ensurePrivacy(u);send(s,200,{sessions:(me.sessions||[]).map(x=>({id:x.id,device:x.device||'Browser',userAgent:x.userAgent||'Unknown device',ip:x.ip||'',createdAt:x.createdAt||new Date().toISOString(),lastSeen:x.lastSeen||x.createdAt||new Date().toISOString(),revoked:!!x.revoked}))})};
 R['POST /api/me/sessions/:id/revoke']=(q,s,u,P)=>{const me=ensurePrivacy(u);const rec=(me.sessions||[]).find(x=>x.id===P.id);if(!rec)return send(s,404,{error:'Session not found'});rec.revoked=true;rec.revokedAt=new Date().toISOString();flush();send(s,200,{ok:true,revoked:true,id:P.id})};
 R['POST /api/users/:id/whatsapp-request']=(q,s,u,P)=>{const t=user(P.id);if(!t||t.id===u.id)return send(s,400,{error:'Invalid request'});
  if(!t.socials?.whatsapp)return send(s,400,{error:'This user has not added WhatsApp'});
  let r=db.waReq.find(x=>x.from===u.id&&x.to===t.id);if(r&&r.status!=='denied')return send(s,200,{status:r.status});
  if(r)r.status='pending';else db.waReq.push(r={id:id('wa'),from:u.id,to:t.id,status:'pending',at:Date.now()});if(c.notify)c.notify({to:t.id,type:'whatsapp_request',actor:au(u.id),text:'wants to see your WhatsApp number',link:'settings',key:'wa:'+u.id});flush();send(s,200,{status:'pending'})};
 R['GET /api/whatsapp-requests']=(q,s,u)=>send(s,200,db.waReq.filter(x=>x.to===u.id&&x.status==='pending').map(x=>({id:x.id,from:au(x.from),at:x.at})));
 R['POST /api/whatsapp-requests/:id']=async(q,s,u,P)=>{const r=db.waReq.find(x=>x.id===P.id&&x.to===u.id);if(!r)return send(s,404,{error:'Not found'});r.status=(await json(q)).approve?'approved':'denied';if(c.notify)c.notify({to:r.from,type:'whatsapp_'+r.status,actor:au(u.id),text:r.status==='approved'?'approved your WhatsApp request':'declined your WhatsApp request',link:'profile/'+u.id});flush();send(s,200,{status:r.status})};
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
  const p={id:id('p'),authorId:u.id,text,category:rs?db.posts.find(x=>x.id===rs).category:cat,media:m,reshareOf:rs,reactions:{},saves:[],shares:0,createdAt:new Date().toISOString()};db.posts.push(p);if(rs&&c.notify){const o=db.posts.find(x=>x.id===rs);if(o)c.notify({to:o.authorId,type:'reshare',actor:au(u.id),text:'reshared your post',link:'post/'+p.id})}save();send(s,200,hp(p,u))};
 R['DELETE /api/posts/:id']=(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(!p)return send(s,404,{error:'Not found'});if(p.authorId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  db.posts=db.posts.filter(x=>x!==p&&x.reshareOf!==p.id);db.comments=db.comments.filter(x=>x.postId!==p.id);save();send(s,200,{ok:true})};
 const toggle=(o,u,e)=>{const had=o.reactions[e]?.includes(u.id);for(const k of Object.keys(o.reactions)){o.reactions[k]=o.reactions[k].filter(x=>x!==u.id);if(!o.reactions[k].length)delete o.reactions[k]}if(!had)(o.reactions[e]??=[]).push(u.id)};
 const EMO=new Set(['👍','❤️','😂','😮','😢','🙏','🔥','🎉']);
 R['POST /api/posts/:id/react']=async(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id),{emoji}=await json(q);if(!p||!EMO.has(emoji))return send(s,400,{error:'Invalid'});const had=(p.reactions[emoji]||[]).includes(u.id);toggle(p,u,emoji);if(!had&&c.notify)c.notify({to:p.authorId,type:'reaction_post',actor:au(u.id),text:'reacted '+emoji+' to your post',link:'post/'+p.id,key:'rp:'+p.id+':'+u.id});save();send(s,200,hp(p,u))};
 R['POST /api/posts/:id/save']=(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(!p)return send(s,404,{error:'Not found'});const i=p.saves.indexOf(u.id);i<0?p.saves.push(u.id):p.saves.splice(i,1);save();send(s,200,hp(p,u))};
 open('POST /api/posts/:id/shared',(q,s,u,P)=>{const p=db.posts.find(x=>x.id===P.id);if(p){p.shares=(p.shares||0)+1;save()}send(s,200,{ok:true})});
 // ----- comments (text, voice, replies, reactions)
 const hc=(x,u)=>({id:x.id,postId:x.postId,parentId:x.parentId,author:au(x.authorId),text:x.text,audio:x.audio,createdAt:x.createdAt,reactionCounts:Object.fromEntries(Object.entries(x.reactions).map(([e,a])=>[e,a.length])),myReaction:u&&Object.entries(x.reactions).find(([,a])=>a.includes(u.id))?.[0]||null});
 open('GET /api/posts/:id/comments',(q,s,u,P)=>send(s,200,db.comments.filter(x=>x.postId===P.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(x=>hc(x,u))));
 R['POST /api/posts/:id/comments']=async(q,s,u,P)=>{const b=await json(q),text=str(b.text,2000),audio=/^\/uploads\/[\w.-]+$/.test(b.audio||'')?b.audio:null;
  if(!db.posts.some(x=>x.id===P.id))return send(s,404,{error:'Post not found'});if(!text&&!audio)return send(s,400,{error:'Write a comment or record a voice note'});
  if(b.parentId&&!db.comments.some(x=>x.id===b.parentId&&x.postId===P.id))return send(s,400,{error:'Reply target not found'});
  const x={id:id('c'),postId:P.id,parentId:b.parentId||null,authorId:u.id,text,audio,reactions:{},createdAt:new Date().toISOString()};db.comments.push(x);
  const post=db.posts.find(y=>y.id===P.id),par=x.parentId&&db.comments.find(y=>y.id===x.parentId),snip=text?text.slice(0,80):'sent a voice note';
  if(c.notify){if(par)c.notify({to:par.authorId,type:'reply',actor:au(u.id),text:'replied to your comment: '+snip,link:'post/'+P.id});
   if(post&&(!par||post.authorId!==par.authorId))c.notify({to:post.authorId,type:'comment',actor:au(u.id),text:'commented on your post: '+snip,link:'post/'+P.id})}
  save();send(s,200,hc(x,u))};
 R['POST /api/comments/:id/react']=async(q,s,u,P)=>{const x=db.comments.find(y=>y.id===P.id),{emoji}=await json(q);if(!x||!EMO.has(emoji))return send(s,400,{error:'Invalid'});const had=(x.reactions[emoji]||[]).includes(u.id);toggle(x,u,emoji);if(!had&&c.notify)c.notify({to:x.authorId,type:'reaction_comment',actor:au(u.id),text:'reacted '+emoji+' to your comment',link:'post/'+x.postId,key:'rc:'+x.id+':'+u.id});save();send(s,200,hc(x,u))};
 R['DELETE /api/comments/:id']=(q,s,u,P)=>{const x=db.comments.find(y=>y.id===P.id);if(!x)return send(s,404,{error:'Not found'});if(x.authorId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  const gone=new Set([x.id]);let n;do{n=gone.size;db.comments.filter(y=>gone.has(y.parentId)).forEach(y=>gone.add(y.id))}while(gone.size>n);db.comments=db.comments.filter(y=>!gone.has(y.id));save();send(s,200,{ok:true})};
 // ----- reports + public group list
 const saveReport=(u,b,targetHint='')=>{const target=str(b.target||targetHint,60),type=str(b.type||'user',20),reason=str(b.reason,500);db.reports.push({id:id('r'),by:u.id,type,target,reason,at:Date.now()});flush();return {ok:true};};
 R['POST /api/report']=async(q,s,u)=>{const b=await json(q);send(s,200,saveReport(u,b));};
 R['POST /api/users/:id/report']=async(q,s,u,P)=>{const b=await json(q);send(s,200,saveReport(u,{...b,target:P.id,type:'user'}));};
 R['POST /api/messages/:id/report']=async(q,s,u,P)=>{const b=await json(q);send(s,200,saveReport(u,{...b,target:P.id,type:'message'}));};
 R['GET /api/me/reports']=(q,s,u)=>send(s,200,db.reports.filter(x=>x.by===u.id).slice(-50).reverse());
 R['GET /api/admin/reports']=(q,s,u)=>isAdmin(u)?send(s,200,db.reports.slice(-100).reverse()):send(s,403,{error:'Admins only'});
 open('GET /api/public/groups',(q,s)=>{let ch=[];try{ch=JSON.parse(db.sync.rblink_channels||'[]')}catch{}send(s,200,ch.filter(x=>!x.isPrivate&&!x.isArchived).map(x=>({id:x.id,name:x.name,description:x.description||'',members:(x.memberIds||[]).length})))});
}
