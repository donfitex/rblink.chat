// Signup (with password confirmation), password recovery, phone OTP, invitation links.
import crypto from 'crypto';
export default function(R,c){
 const{db,flush,send,json,session,hash,mk,sendMail,sendSms}=c,prod=process.env.NODE_ENV==='production';
 db.resets??={};db.otps??={};db.invites??={};
 const sha=t=>crypto.createHash('sha256').update(String(t)).digest('hex');
 const origin=q=>process.env.APP_URL||`${q.headers['x-forwarded-proto']||'http'}://${q.headers.host}`;
 const open=(k,f)=>{f.open=true;R[k]=f};
 const pwCheck=b=>String(b.password||'').length<8?'Password must be at least 8 characters':b.password!==b.confirmPassword?'Passwords do not match':'';
 const useInvite=(t,u)=>{const i=db.invites[t];if(i&&i.exp>Date.now()&&i.uses<i.max){i.uses++;u.invitedBy=i.by;u.inviteToken=t;flush()}};
 c.useInvite=useInvite;
 open('POST /api/auth/signup',async(q,s)=>{const b=await json(q),e=String(b.email||'').trim().toLowerCase();
  if(!String(b.name||'').trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return send(s,400,{error:'Enter your name and a valid email'});
  const pe=pwCheck(b);if(pe)return send(s,400,{error:pe});
  if(db.users.some(u=>u.email===e))return send(s,409,{error:'An account with this email already exists'});
  const u=mk(String(b.name).trim(),e,b.password);if(b.invite)useInvite(b.invite,u);session(q,s,u)});
 open('POST /api/auth/forgot',async(q,s)=>{const e=String((await json(q)).email||'').trim().toLowerCase(),u=e&&db.users.find(x=>x.email===e),out={ok:true,message:'If that email has an account, a reset link is on its way.'};
  if(u){const t=crypto.randomBytes(32).toString('hex');db.resets[sha(t)]={uid:u.id,exp:Date.now()+36e5};flush();const link=`${origin(q)}/#/reset?token=${t}`;
   const m=await sendMail({to:u.email,subject:'Reset your rblink.chat password',text:`Hi ${u.name},\n\nUse this link within 1 hour to choose a new password:\n${link}\n\nIf you did not ask for this, ignore this email.`});if(!m.sent&&!prod)out.devLink=link}
  send(s,200,out)});
 open('POST /api/auth/reset',async(q,s)=>{const b=await json(q),k=sha(b.token),r=db.resets[k];
  if(!r||r.exp<Date.now())return send(s,400,{error:'This reset link is invalid or has expired'});
  const pe=pwCheck(b);if(pe)return send(s,400,{error:pe});
  const u=db.users.find(x=>x.id===r.uid);u.pw=hash(b.password);delete db.resets[k];flush();session(q,s,u)});
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
