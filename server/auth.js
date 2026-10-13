// Signup (with password confirmation), password recovery, phone OTP, invitation links.
import crypto from 'crypto';
export default function(R,c){
 const{db,flush,send,json,session,hash,mk,sendMail,sendSms}=c,prod=process.env.NODE_ENV==='production';
 db.resets??={};db.otps??={};db.invites??={};db.emailVerifications??={};
 const sha=t=>crypto.createHash('sha256').update(String(t)).digest('hex');
 const origin=q=>process.env.APP_URL||`${q.headers['x-forwarded-proto']||'http'}://${q.headers.host}`;
 const open=(k,f)=>{f.open=true;R[k]=f};
 const breached=async password=>{const h=crypto.createHash('sha1').update(String(password),'utf8').digest('hex').toUpperCase(),prefix=h.slice(0,5),suffix=h.slice(5);try{const r=await fetch(`https://api.pwnedpasswords.com/range/${prefix}`,{headers:{'User-Agent':'rblink.chat password safety check','Add-Padding':'true'}});if(!r.ok)throw Error('unavailable');return (await r.text()).split(/\r?\n/).some(x=>x.split(':')[0]===suffix)}catch{throw Error('Password safety check is temporarily unavailable. Please try again.')}};
 const pwCheck=async b=>{if(String(b.password||'').length<12)return'Use a password with at least 12 characters';if(b.password!==b.confirmPassword)return'Passwords do not match';if(await breached(b.password))return'That password has appeared in a data breach. Choose a different one.';return''};
 const verification=async(q,u)=>{const t=crypto.randomBytes(32).toString('hex');db.emailVerifications[sha(t)]={uid:u.id,exp:Date.now()+864e5};flush();const link=`${origin(q)}/#/verify-email?token=${t}`;const m=await sendMail({to:u.email,subject:'Verify your rblink.chat email',text:`Hi ${u.name},\n\nVerify your email within 24 hours:\n${link}\n\nIf you did not create this account, ignore this email.`});return{message:'Check your email to verify your account.',...(!m.sent&&!prod?{devLink:link}:{})}};
 const useInvite=(t,u)=>{const i=db.invites[t];if(i&&i.exp>Date.now()&&i.uses<i.max){i.uses++;u.invitedBy=i.by;u.inviteToken=t;flush()}};
 c.useInvite=useInvite;
 open('POST /api/auth/signup',async(q,s)=>{const b=await json(q),e=String(b.email||'').trim().toLowerCase();
  if(!String(b.name||'').trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return send(s,400,{error:'Enter your name and a valid email'});
  const pe=await pwCheck(b);if(pe)return send(s,400,{error:pe});
  if(db.users.some(u=>u.email===e))return send(s,409,{error:'An account with this email already exists'});
  const u=mk(String(b.name).trim(),e,b.password,{emailVerified:false});if(b.invite)useInvite(b.invite,u);send(s,201,await verification(q,u))});
 open('POST /api/auth/forgot',async(q,s)=>{const e=String((await json(q)).email||'').trim().toLowerCase(),u=e&&db.users.find(x=>x.email===e),out={ok:true,message:'If that email has an account, a reset link is on its way.'};
  if(u){const t=crypto.randomBytes(32).toString('hex');db.resets[sha(t)]={uid:u.id,exp:Date.now()+36e5};flush();const link=`${origin(q)}/#/reset?token=${t}`;
   const m=await sendMail({to:u.email,subject:'Reset your rblink.chat password',text:`Hi ${u.name},\n\nUse this link within 1 hour to choose a new password:\n${link}\n\nIf you did not ask for this, ignore this email.`});if(!m.sent&&!prod)out.devLink=link}
  send(s,200,out)});
 open('POST /api/auth/reset',async(q,s)=>{const b=await json(q),k=sha(b.token),r=db.resets[k];
  if(!r||r.exp<Date.now())return send(s,400,{error:'This reset link is invalid or has expired'});
  const pe=await pwCheck(b);if(pe)return send(s,400,{error:pe});
  const u=db.users.find(x=>x.id===r.uid);u.pw=hash(b.password);delete db.resets[k];flush();session(q,s,u)});\n open('GET /api/auth/verify-email',async(q,s,u,P,x)=>{const t=x.searchParams.get('token')||'',r=db.emailVerifications[sha(t)];if(!r||r.exp<Date.now())return send(s,400,{error:'This verification link is invalid or has expired'});const v=db.users.find(a=>a.id===r.uid);if(!v)return send(s,400,{error:'Account not found'});v.emailVerified=true;delete db.emailVerifications[sha(t)];flush();session(q,s,v)});\n open('POST /api/auth/resend-verification',async(q,s)=>{const e=String((await json(q)).email||'').trim().toLowerCase(),u=db.users.find(a=>a.email===e);if(!u||u.emailVerified)return send(s,200,{ok:true});send(s,200,await verification(q,u))});
 const E164=/^\+[1-9]\d{7,14}$/;
 open('POST /api/auth/phone/start',async(q,s)=>{const{phone}=await json(q);if(!E164.test(phone||''))return send(s,400,{error:'Use international format, e.g. +2348012345678'});
  const o=db.otps[phone];if(o&&Date.now()-o.sent<3e4)return send(s,429,{error:'Wait 30 seconds before asking for another code'});
  const code=String(crypto.randomInt(0,1e6)).padStart(6,'0');db.otps[phone]={h:sha(code+phone),exp:Date.now()+6e5,tries:0,sent:Date.now()};flush();
  const m=await sendSms(phone,`Your rblink.chat code is ${code}. It expires in 10 minutes.`),dev=process.env.DEV_OTP==='1'||!prod;
  if(!m.sent&&!dev)return send(s,501,{error:'SMS sign-in is not configured on this server'});send(s,200,m.sent?{ok:true}:{ok:true,devCode:code})});
 open('POST /api/auth/phone/verify',async(q,s)=>{const b=await json(q),o=db.otps[b.phone];
  if(!o||o.exp<Date.now()||o.tries>=5)return send(s,400,{error:'Code expired. Ask for a new one'});
  if(sha(String(b.code||'').trim()+b.phone)!==o.h){o.tries++;flush();return send(s,400,{error:'Wrong code'})}
  let u=db.users.find(x=>x.phone===b.phone);
  if(!u){if(!String(b.name||'').trim())return send(s,400,{error:'Enter your name to create your account',needName:true});u=mk(String(b.name).trim(),'','',{phone:b.phone});if(b.invite)useInvite(b.invite,u)}
  delete db.otps[b.phone];flush();session(q,s,u)});
 R['POST /api/invites']=async(q,s,u)=>{const t=crypto.randomBytes(9).toString('base64url');db.invites[t]={by:u.id,exp:Date.now()+7*864e5,uses:0,max:50};flush();send(s,200,{token:t,link:`${origin(q)}/#/join/${t}`})};
 R['GET /api/invites/mine']=(q,s,u)=>send(s,200,Object.entries(db.invites).filter(([,i])=>i.by===u.id).map(([t,i])=>({token:t,uses:i.uses,max:i.max,exp:i.exp,referred:db.users.filter(x=>x.invitedBy===u.id&&x.inviteToken===t).length,link:`${origin(q)}/#/join/${t}`})));
 open('GET /api/invites/:token',(q,s,u,P)=>{const i=db.invites[P.token];if(!i||i.exp<Date.now()||i.uses>=i.max)return send(s,404,{valid:false});send(s,200,{valid:true,inviter:db.users.find(x=>x.id===i.by)?.name||'A member'})});
}
