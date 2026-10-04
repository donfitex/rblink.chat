// rblink.chat server: zero runtime dependencies (Node 18+). Auth, persistence, sync, uploads, WebSocket.
import http from 'http';import crypto from 'crypto';import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
import {sendMail,sendSms} from './mail.js';import authMod from './auth.js';import socialMod from './social.js';import workMod from './work.js';import roomsMod from './rooms.js';import aiMod from './ai.js';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const DATA=path.resolve(process.env.DATA_DIR||path.join(root,'data')),UP=path.join(DATA,'uploads'),DBF=path.join(DATA,'db.json');
const GOOGLE=process.env.GOOGLE_CLIENT_ID||'',KEYS=['rblink_workspace','rblink_users','rblink_channels','rblink_dms','rblink_messages'];
fs.mkdirSync(UP,{recursive:true});
let db={secret:crypto.randomBytes(32).toString('hex'),users:[],rev:0,sync:{}};
try{db={...db,...JSON.parse(fs.readFileSync(DBF,'utf8'))}}catch{}
const SECRET=process.env.SESSION_SECRET||db.secret;
const flush=()=>{fs.writeFileSync(DBF+'.tmp',JSON.stringify(db));fs.renameSync(DBF+'.tmp',DBF)};
let st;const save=()=>{clearTimeout(st);st=setTimeout(flush,200)};flush();
for(const sg of['SIGTERM','SIGINT'])process.on(sg,()=>{flush();process.exit(0)});
// ---- auth helpers
const sign=uid=>{const p=Buffer.from(JSON.stringify({uid,exp:Date.now()+30*864e5})).toString('base64url');return p+'.'+crypto.createHmac('sha256',SECRET).update(p).digest('base64url')};
const verify=t=>{try{const[p,s]=String(t).split('.'),e=crypto.createHmac('sha256',SECRET).update(p).digest('base64url');if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return;const d=JSON.parse(Buffer.from(p,'base64url'));return d.exp>Date.now()?db.users.find(u=>u.id===d.uid):undefined}catch{}};
const authOf=(q,url)=>verify((/(?:^|;\s*)rblink_token=([^;]+)/.exec(q.headers.cookie||'')||[])[1]||url.searchParams.get('token'));
const hash=pw=>{const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(pw,s,64).toString('hex')};
const check=(pw,h)=>{const[s,k]=String(h).split(':');return !!k&&crypto.timingSafeEqual(crypto.scryptSync(pw,s,64),Buffer.from(k,'hex'))};
const pub=u=>({id:u.id,name:u.name,email:u.email||'',phone:u.phone||'',avatar:u.avatar||'',role:u.role,recruiter:!!u.recruiter,headline:u.headline||''});
const mk=(name,email,pw,extra={})=>{const u={id:'u_'+crypto.randomBytes(6).toString('hex'),name:name.slice(0,60),email:email.toLowerCase(),pw:pw?hash(pw):'',role:db.users.length?'member':'owner',avatar:'',createdAt:new Date().toISOString(),...extra};db.users.push(u);flush();return u};
const hits=new Map(),limited=ip=>{const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<6e4);a.push(n);hits.set(ip,a);return a.length>30};
// ---- http helpers
const MAXB=(+process.env.UPLOAD_MAX_MB||100)*1024*1024,OKEXT=new Set('.png .jpg .jpeg .gif .webp .avif .mp4 .webm .mov .m4v .ogv .mp3 .wav .ogg .m4a .aac .pdf .doc .docx .xls .xlsx .ppt .pptx .txt .csv .zip'.split(' '));
const body=(q,max=2e7)=>new Promise((ok,no)=>{const c=[];let n=0,big=false;q.on('data',d=>{n+=d.length;if(n>max)big=true;else c.push(d)});q.on('end',()=>big?no(Object.assign(new Error('too big'),{code:413})):ok(Buffer.concat(c)));q.on('error',no)});
const json=async q=>JSON.parse((await body(q)).toString()||'{}');
const SEC={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(self), microphone=(self), display-capture=(self), geolocation=()'};
const send=(s,c,o,h={})=>{s.writeHead(c,{'Content-Type':'application/json',...SEC,...h});s.end(JSON.stringify(o))};
const session=(q,s,u)=>send(s,200,{user:pub(u),token:sign(u.id)},{'Set-Cookie':`rblink_token=${sign(u.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${q.headers['x-forwarded-proto']==='https'?'; Secure':''}`});
// ---- routes
const open=new Set(['GET /api/health','GET /api/config','POST /api/auth/signup','POST /api/auth/login','POST /api/auth/google','POST /api/auth/logout']);
const R={
 'GET /api/health':(q,s)=>send(s,200,{status:'ok',service:'rblink.chat server',version:'2.0.0',timestamp:new Date().toISOString()}),
 'GET /api/config':(q,s)=>send(s,200,{googleClientId:GOOGLE}),
 'POST /api/auth/signup':async(q,s)=>{const{name,email,password}=await json(q),e=String(email||'').trim().toLowerCase();
  if(!String(name||'').trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return send(s,400,{error:'Enter your name and a valid email'});
  if(String(password||'').length<8)return send(s,400,{error:'Password must be at least 8 characters'});
  if(db.users.some(u=>u.email===e))return send(s,409,{error:'An account with this email already exists'});
  session(q,s,mk(String(name).trim(),e,password))},
 'POST /api/auth/login':async(q,s)=>{const{email,password}=await json(q),u=db.users.find(x=>x.email===String(email||'').trim().toLowerCase());
  if(!u||!u.pw||!check(String(password||''),u.pw))return send(s,401,{error:'Incorrect email or password'});session(q,s,u)},
 'POST /api/auth/google':async(q,s)=>{if(!GOOGLE)return send(s,501,{error:'Google sign-in is not configured on this server'});
  const{credential}=await json(q),r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential||'')),g=await r.json();
  if(!r.ok||g.aud!==GOOGLE||g.email_verified!=='true')return send(s,401,{error:'Google sign-in failed'});
  let u=db.users.find(x=>x.googleId===g.sub||x.email===g.email.toLowerCase());
  if(!u)u=mk(g.name||g.email,g.email,'',{avatar:g.picture||''});u.googleId=g.sub;flush();session(q,s,u)},
 'POST /api/auth/logout':(q,s)=>send(s,200,{ok:true},{'Set-Cookie':'rblink_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'}),
 'GET /api/auth/me':(q,s,u)=>send(s,200,{user:pub(u)}),
 'GET /api/sync':(q,s)=>send(s,200,{rev:db.rev,data:db.sync}),
 'GET /api/sync/rev':(q,s)=>send(s,200,{rev:db.rev}),
 'PUT /api/sync':async(q,s)=>{const b=await json(q);if(b.baseRev!==db.rev)return send(s,409,{rev:db.rev,data:db.sync});
  for(const k of KEYS)if(typeof b.data?.[k]==='string')db.sync[k]=b.data[k];db.rev++;save();bcast({type:'sync',payload:{rev:db.rev}});send(s,200,{rev:db.rev})},
 'POST /api/upload':async(q,s)=>{const m=/boundary=(?:"([^"]+)"|([^;]+))/.exec(q.headers['content-type']||'');if(!m)return send(s,400,{error:'Expected multipart upload'});
  const buf=await body(q,MAXB),b=Buffer.from('--'+(m[1]||m[2])),files=[];let i=buf.indexOf(b);
  while(i>=0){const j=buf.indexOf(b,i+b.length);if(j<0)break;const part=buf.subarray(i+b.length+2,j-2),h=part.indexOf('\r\n\r\n'),head=part.subarray(0,h).toString(),fn=/filename="([^"]*)"/.exec(head);
   if(fn&&files.length<10){const data=part.subarray(h+4),name=path.basename(fn[1])||'file',fname=`file-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(name).replace(/[^.\w]/g,'').slice(0,10)}`;
    if(!OKEXT.has(path.extname(name).toLowerCase()))return send(s,415,{error:'This file type is not allowed'});fs.writeFileSync(path.join(UP,fname),data);
    files.push({id:'att_'+crypto.randomBytes(5).toString('hex'),name,size:data.length,type:(/Content-Type:\s*([^\r\n]+)/i.exec(head)||[])[1]||'application/octet-stream',url:'/uploads/'+fname,uploadedAt:new Date().toISOString()})}
   i=j}
  files.length?send(s,200,{success:true,files}):send(s,400,{error:'No files uploaded'})}
};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.m4v':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.aac':'audio/aac','.txt':'text/plain'};
const risky=new Set(['.html','.htm','.svg','.js','.xml']);
function serve(s,dir,rel,isUpload){const f=path.resolve(dir,'.'+path.sep+rel);if(!f.startsWith(dir+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return false;
 const e=path.extname(f).toLowerCase(),h={'Content-Type':mime[e]||'application/octet-stream',...SEC};
 if(isUpload&&risky.has(e)){h['Content-Type']='application/octet-stream';h['Content-Disposition']='attachment'}s.writeHead(200,h);fs.createReadStream(f).pipe(s);return true}
const pats=[];
const route=key=>{if(R[key])return{fn:R[key],P:{}};const i=key.indexOf(' '),m=key.slice(0,i),p=key.slice(i+1);for(const x of pats){if(x.m!==m)continue;const r=x.re.exec(p);if(r)return{fn:R[x.key],P:Object.fromEntries(x.names.map((n,j)=>[n,decodeURIComponent(r[j+1])]))}}};
const server=http.createServer(async(q,s)=>{
 try{const url=new URL(q.url,'http://x'),key=q.method+' '+url.pathname,rt=route(key);
  if(rt){const{fn,P}=rt;if(key.includes('/auth/')&&key!=='GET /api/auth/me'&&limited(q.socket.remoteAddress))return send(s,429,{error:'Too many attempts, wait a minute'});
   const u=authOf(q,url);if(!(open.has(key)||fn.open)&&!u)return send(s,401,{error:'Please log in'});return await fn(q,s,u,P,url)}
  if(url.pathname.startsWith('/api/'))return send(s,404,{error:'Not found'});
  const p=decodeURIComponent(url.pathname);
  if(p.startsWith('/uploads/'))return serve(s,UP,p.slice(9),true)||send(s,404,{error:'Not found'});
  const dist=path.join(root,'dist');if(!fs.existsSync(dist)){s.writeHead(503);return s.end('Frontend not built. Run: npm run build')}
  if(!serve(s,dist,p==='/'?'index.html':p.slice(1)))serve(s,dist,'index.html')
 }catch(e){if(!s.headersSent)send(s,e.code===413?413:400,{error:e.code===413?'File too large':'Bad request'});else s.end()}});
// ---- minimal WebSocket (RFC 6455) so no dependency is needed
const clients=new Set(),GUID='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const enc=(d,op=1)=>{d=Buffer.from(d);const l=d.length,h=l<126?Buffer.from([128|op,l]):l<65536?Buffer.from([128|op,126,l>>8,l&255]):(()=>{const x=Buffer.alloc(10);x[0]=128|op;x[1]=127;x.writeBigUInt64BE(BigInt(l),2);return x})();return Buffer.concat([h,d])};
function frame(b){if(b.length<2)return;let l=b[1]&127,o=2;if(l===126){if(b.length<4)return;l=b.readUInt16BE(2);o=4}else if(l===127){if(b.length<10)return;l=Number(b.readBigUInt64BE(2));o=10}
 if(l>1e6)return{op:8,n:b.length,data:Buffer.alloc(0)};const m=b[1]&128?4:0;if(b.length<o+m+l)return;let d=b.subarray(o+m,o+m+l);
 if(m){const k=b.subarray(o,o+4);d=Buffer.from(d.map((x,i)=>x^k[i%4]))}return{op:b[0]&15,data:d,n:o+m+l}}
const bcast=(m,except)=>{const d=enc(JSON.stringify(m));for(const c of clients)if(c!==except&&!c.sock.destroyed)c.sock.write(d)};
const ALLOW={'message:new':p=>p.senderId,'reaction:toggle':p=>p.userId,'user:status':p=>p.userId};
server.on('upgrade',(q,sock)=>{const url=new URL(q.url,'http://x'),u=url.pathname==='/ws'&&authOf(q,url);
 if(!u||!q.headers['sec-websocket-key']){sock.end('HTTP/1.1 401 Unauthorized\r\n\r\n');return}
 sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(q.headers['sec-websocket-key']+GUID).digest('base64')+'\r\n\r\n');
 const c={sock,u,state:{}};clients.add(c);let buf=Buffer.alloc(0);
 sock.on('data',d=>{buf=Buffer.concat([buf,d]);let f;while((f=frame(buf))){buf=buf.subarray(f.n);if(f.op===8){sock.end();return}if(f.op===9)sock.write(enc(f.data,10));
  if(f.op===1)try{const m=JSON.parse(f.data.toString());if(String(m.type).startsWith('rtc:')){rooms.onMessage(c,m);continue}const g=ALLOW[m.type];if(g&&m.payload&&g(m.payload)===u.id)bcast(m,c)}catch{}}});
 const gone=()=>{clients.delete(c);rooms.onClose(c)};sock.on('close',gone);sock.on('error',gone)});
const wsSend=(c,m)=>{if(!c.sock.destroyed)c.sock.write(enc(JSON.stringify(m)))};
const ctx={db,flush,save,send,json,body,bcast,wsSend,clients,pub,mk,session,hash,check,sign,authOf,sendMail,sendSms,MAXB};
for(const m of[authMod,socialMod,workMod,aiMod])m(R,ctx);
const rooms=roomsMod(R,ctx);
for(const key of Object.keys(R)){if(!key.includes(':'))continue;const sp=key.indexOf(' ');pats.push({m:key.slice(0,sp),key,re:new RegExp('^'+key.slice(sp+1).replace(/:(\w+)/g,'([^/]+)')+'$'),names:[...key.matchAll(/:(\w+)/g)].map(x=>x[1])})}
server.listen(process.env.PORT||3001,()=>console.log(`[rblink.chat] listening on http://localhost:${server.address().port}`));
