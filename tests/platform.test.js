// Integration tests for the platform features: recovery, phone, invites, posts, WhatsApp privacy, market, jobs, rooms, AI.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import http from 'node:http';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rblink2-')),PORT=4800+Math.floor(Math.random()*400),B=`http://localhost:${PORT}`;
let proc,mock;
const start=()=>new Promise((ok,no)=>{proc=spawn('node',['server/index.js'],{env:{...process.env,PORT,DATA_DIR:dir,NODE_ENV:'development',AI_BASE_URL:'http://localhost:'+(PORT+1000)+'/v1',AI_MODEL:'mock',ROOM_MAX:'2'}});proc.stdout.on('data',d=>/listening/.test(d)&&ok());setTimeout(()=>no(new Error('timeout')),8000)});
const call=async(m,p,b,t)=>{const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(t?{Cookie:'rblink_token='+t}:{})},body:b?JSON.stringify(b):undefined});let j={};try{j=await r.json()}catch{}return{status:r.status,j}};
const signup=async(name,email)=>(await call('POST','/api/auth/signup',{name,email,password:'password123',confirmPassword:'password123'})).j;
const ws=t=>new Promise((ok,no)=>{const w=new WebSocket(`ws://localhost:${PORT}/ws?token=${t}`),got=[];w.onmessage=e=>got.push(JSON.parse(e.data));w.onopen=()=>ok({w,got});w.onerror=()=>no(new Error('ws'))});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),send=(c,type,payload)=>c.w.send(JSON.stringify({type,payload}));
let admin,ann,bob;
test.before(async()=>{mock=http.createServer((q,s)=>{let d='';q.on('data',c=>d+=c);q.on('end',()=>{const b=JSON.parse(d);s.setHeader('Content-Type','application/json');const last=b.messages.at(-1).content;s.end(JSON.stringify({choices:[{message:{content:last==='whatsys'?b.messages.filter(m=>m.role==='system').map(m=>m.content).join(' || '):'echo: '+last}}]}))})}).listen(PORT+1000);await start();
 admin=await signup('Admin','admin@x.com');ann=await signup('Ann','ann@x.com');bob=await signup('Bob','bob@x.com')});
test.after(async()=>{await new Promise(r=>{proc.on('exit',r);proc.kill('SIGTERM')});mock.close();fs.rmSync(dir,{recursive:true,force:true})});

test('signup needs matching passwords',async()=>{
 const r=await call('POST','/api/auth/signup',{name:'C',email:'c@x.com',password:'password123',confirmPassword:'different1'});assert.equal(r.status,400);assert.match(r.j.error,/match/)});
test('password recovery: reset link works once, old password stops working',async()=>{
 const f=(await call('POST','/api/auth/forgot',{email:'ann@x.com'})).j;assert.ok(f.devLink);
 assert.equal((await call('POST','/api/auth/forgot',{email:'nobody@x.com'})).j.devLink,undefined);
 const token=new URL(f.devLink.replace('/#/','/')).searchParams.get('token');
 assert.equal((await call('POST','/api/auth/reset',{token,password:'newpassword1',confirmPassword:'nope'})).status,400);
 assert.equal((await call('POST','/api/auth/reset',{token,password:'newpassword1',confirmPassword:'newpassword1'})).status,200);
 assert.equal((await call('POST','/api/auth/reset',{token,password:'newpassword2',confirmPassword:'newpassword2'})).status,400);
 assert.equal((await call('POST','/api/auth/login',{email:'ann@x.com',password:'password123'})).status,401);
 assert.equal((await call('POST','/api/auth/login',{email:'ann@x.com',password:'newpassword1'})).status,200)});
test('phone sign-in: code, wrong code, new account needs a name, then login',async()=>{
 assert.equal((await call('POST','/api/auth/phone/start',{phone:'0801'})).status,400);
 const st=(await call('POST','/api/auth/phone/start',{phone:'+2348012345678'})).j;assert.match(st.devCode,/^\d{6}$/);
 assert.equal((await call('POST','/api/auth/phone/verify',{phone:'+2348012345678',code:'000000'})).status,400);
 const nn=await call('POST','/api/auth/phone/verify',{phone:'+2348012345678',code:st.devCode});assert.equal(nn.j.needName,true);
 const ok=await call('POST','/api/auth/phone/verify',{phone:'+2348012345678',code:st.devCode,name:'Phone User'});assert.equal(ok.status,200);assert.equal(ok.j.user.phone,'+2348012345678')});
test('invite links',async()=>{
 const i=(await call('POST','/api/invites',{},admin.token)).j;assert.match(i.link,/#\/join\//);
 assert.equal((await call('GET','/api/invites/'+i.token)).j.inviter,'Admin');assert.equal((await call('GET','/api/invites/bad')).status,404);
 const u=(await call('POST','/api/auth/signup',{name:'Invited',email:'inv@x.com',password:'password123',confirmPassword:'password123',invite:i.token})).j;assert.ok(u.user);
 const mine=(await call('GET','/api/invites/mine',null,admin.token)).j;assert.equal(mine[0].uses,1);assert.equal(mine[0].referred,1);assert.match(mine[0].link,/#\/join\//);
 assert.deepEqual((await call('GET','/api/invites/mine',null,bob.token)).j,[])});
test('visitors see names only; members see profiles; WhatsApp needs approval',async()=>{
 const v=(await call('GET','/api/users')).j;assert.deepEqual(Object.keys(v[0]).sort(),['avatar','id','name']);
 assert.equal((await call('GET','/api/users/'+ann.user.id)).status,401);
 await call('PATCH','/api/me/profile',{headline:'Dev',bio:'hi',socials:{github:'ann-dev',whatsapp:'+234 801 111',linkedin:'linkedin.com/in/ann',instagram:'javascript:alert(1)'}},ann.token);
 let p=(await call('GET','/api/users/'+ann.user.id,null,bob.token)).j;assert.equal(p.whatsapp,null);assert.equal(p.hasWhatsapp,true);assert.equal(p.socials.github,'ann-dev');assert.equal(p.socials.linkedin,'https://linkedin.com/in/ann');assert.equal(p.socials.instagram,undefined);assert.equal(p.waStatus,'none');
 assert.equal((await call('POST','/api/users/'+ann.user.id+'/whatsapp-request',{},bob.token)).j.status,'pending');
 p=(await call('GET','/api/users/'+ann.user.id,null,bob.token)).j;assert.equal(p.whatsapp,null);assert.equal(p.waStatus,'pending');
 const inbox=(await call('GET','/api/whatsapp-requests',null,ann.token)).j;assert.equal(inbox.length,1);
 assert.equal((await call('POST','/api/whatsapp-requests/'+inbox[0].id,{approve:true},bob.token)).status,404);
 await call('POST','/api/whatsapp-requests/'+inbox[0].id,{approve:true},ann.token);
 p=(await call('GET','/api/users/'+ann.user.id,null,bob.token)).j;assert.equal(p.whatsapp,'+234801111');
 assert.equal((await call('GET','/api/users/'+ann.user.id,null,admin.token)).j.whatsapp,null)});
let post;
test('posts: public read, member write, reactions, save, reshare, delete rules',async()=>{
 assert.equal((await call('POST','/api/posts',{text:'x'})).status,401);
 post=(await call('POST','/api/posts',{text:'Match report',category:'sports',media:[{url:'/uploads/a.jpg',type:'image'},{url:'http://evil.com/x',type:'image'}]},ann.token)).j;assert.equal(post.media.length,1);
 assert.equal((await call('POST','/api/posts',{},ann.token)).status,400);
 assert.equal((await call('GET','/api/posts?category=sports')).j.length,1);assert.equal((await call('GET','/api/posts?category=news')).j.length,0);
 assert.equal((await call('POST',`/api/posts/${post.id}/react`,{emoji:'🔥'},bob.token)).j.reactionCounts['🔥'],1);
 assert.equal((await call('POST',`/api/posts/${post.id}/react`,{emoji:'❤️'},bob.token)).j.reactionCounts['🔥'],undefined);
 assert.equal((await call('POST',`/api/posts/${post.id}/save`,{},bob.token)).j.saved,true);
 assert.equal((await call('GET','/api/posts?tab=saved',null,bob.token)).j.length,1);assert.equal((await call('GET','/api/posts?tab=saved')).status,401);
 const rs=(await call('POST','/api/posts',{reshareOf:post.id,text:'must read'},bob.token)).j;assert.equal(rs.original.id,post.id);
 assert.equal((await call('GET','/api/posts?author='+bob.user.id+'&tab=reshared')).j.length,1);
 assert.equal((await call('DELETE','/api/posts/'+post.id,null,bob.token)).status,403)});
test('comments: replies, voice, reactions; visitors read only',async()=>{
 const c1=(await call('POST',`/api/posts/${post.id}/comments`,{text:'Great'},bob.token)).j;
 const c2=(await call('POST',`/api/posts/${post.id}/comments`,{audio:'/uploads/v.webm',parentId:c1.id},ann.token)).j;assert.equal(c2.parentId,c1.id);assert.equal(c2.audio,'/uploads/v.webm');
 assert.equal((await call('POST',`/api/posts/${post.id}/comments`,{text:'hi'})).status,401);
 assert.equal((await call('POST','/api/comments/'+c1.id+'/react',{emoji:'👍'},ann.token)).j.reactionCounts['👍'],1);
 assert.equal((await call('GET',`/api/posts/${post.id}/comments`)).j.length,2);
 await call('DELETE','/api/comments/'+c1.id,null,bob.token);assert.equal((await call('GET',`/api/posts/${post.id}/comments`)).j.length,0)});
test('marketplace: members list, anyone searches and filters',async()=>{
 assert.equal((await call('POST','/api/market',{title:'Phone',price:5,country:'Nigeria'})).status,401);
 const mk=(t,price,country,city,category)=>call('POST','/api/market',{title:t,price,country,city,category,currency:'USD'},ann.token);
 await mk('iPhone 13',400,'Nigeria','Lagos','phones');await mk('Toyota Camry',5000,'Ghana','Accra','vehicles');await mk('Samsung phone',150,'Nigeria','Abuja','phones');
 assert.equal((await mk('',1,'x')).status,400);
 const g=p=>call('GET','/api/market'+p).then(r=>r.j.items.map(i=>i.title));
 assert.equal((await g('')).length,3);assert.deepEqual(await g('?q=phone&country=Nigeria&max=200'),['Samsung phone']);assert.deepEqual(await g('?category=vehicles'),['Toyota Camry']);assert.deepEqual(await g('?city=lag'),['iPhone 13']);
 assert.deepEqual(await g('?country=Nigeria&sort=price_asc'),['Samsung phone','iPhone 13']);
 const mine=(await call('GET','/api/market?seller='+ann.user.id,null,ann.token)).j.items;assert.equal(mine.length,3);
 assert.equal((await call('PATCH','/api/market/'+mine[0].id,{status:'sold'},bob.token)).status,403);
 await call('PATCH','/api/market/'+mine[0].id,{status:'sold'},ann.token);
 assert.equal((await g('')).length,2);
 assert.equal((await call('GET','/api/market?seller='+ann.user.id,null,ann.token)).j.items.length,3);
 assert.equal((await call('GET','/api/market?seller='+ann.user.id)).j.items.length,2)});
let job;
test('jobs: only approved recruiters post; applications honour required fields',async()=>{
 const body={title:'Dev',company:'Acme',description:'Build things',location:'Lagos',endDate:'2099-01-01',applyEmail:'hr@acme.com',cvEmail:'cv@acme.com',form:{fields:{currentPosition:{on:true,req:true},cv:{on:true,req:false},coverLetter:{on:true,req:false}},custom:[{label:'Why us?',req:true}]}};
 assert.equal((await call('POST','/api/jobs',body,ann.token)).status,403);
 assert.equal((await call('POST','/api/recruiter/request',{company:'Acme'},ann.token)).j.status,'pending');
 assert.equal((await call('GET','/api/admin/recruiters',null,ann.token)).status,403);
 const rq=(await call('GET','/api/admin/recruiters',null,admin.token)).j;assert.equal(rq.length,1);
 await call('POST','/api/admin/recruiters/'+rq[0].id,{approve:true},admin.token);
 job=(await call('POST','/api/jobs',body,ann.token)).j;assert.equal(job.form.fields.email.req,true);assert.equal(job.applyEmail,'hr@acme.com');
 const pub=(await call('GET','/api/jobs')).j;assert.equal(pub.length,1);assert.equal(pub[0].applyEmail,undefined);assert.equal(pub[0].cvEmail,'cv@acme.com');
 assert.equal((await call('POST','/api/jobs',{...body,cvEmail:'bad'},ann.token)).status,400);
 const ap=a=>call('POST',`/api/jobs/${job.id}/apply`,a,bob.token);
 assert.match((await ap({answers:{email:'b@x.com',fullName:'Bob'}})).j.error,/Current position.*Why us/);
 assert.equal((await ap({answers:{email:'bad',fullName:'Bob',currentPosition:'Dev'},custom:{q0:'x'}})).status,400);
 assert.equal((await ap({answers:{email:'b@x.com',fullName:'Bob',currentPosition:'Dev',cv:'http://evil.com/cv.pdf'},custom:{q0:'x'}})).status,400);
 assert.equal((await ap({answers:{email:'b@x.com',fullName:'Bob',currentPosition:'Dev',cv:'https://drive.google.com/file/d/1'},custom:{q0:'Growth'}})).status,200);
 assert.equal((await ap({answers:{email:'b@x.com',fullName:'Bob',currentPosition:'Dev'},custom:{q0:'x'}})).status,409);
 assert.equal((await call('GET',`/api/jobs/${job.id}/applications`,null,bob.token)).status,403);
 const apps=(await call('GET',`/api/jobs/${job.id}/applications`,null,ann.token)).j;assert.equal(apps[0].custom['Why us?'],'Growth');
 const au=`/api/jobs/${job.id}/applications/${apps[0].id}`;assert.equal(apps[0].status,'new');
 assert.equal((await call('PATCH',au,{status:'shortlisted'},bob.token)).status,403);assert.equal((await call('PATCH',au,{status:'bogus'},ann.token)).status,400);
 assert.equal((await call('PATCH',au,{status:'shortlisted'},ann.token)).j.status,'shortlisted');
 const my=(await call('GET','/api/me/applications',null,bob.token)).j;assert.equal(my[0].job.title,'Dev');assert.equal(my[0].status,'shortlisted');
 await call('PATCH','/api/jobs/'+job.id,{closed:true},ann.token);assert.equal((await call('GET','/api/jobs')).j.length,0)});
test('rooms: create, signaling relay, room chat with voice, capacity, host ends',async()=>{
 const r=(await call('POST','/api/rooms',{type:'meeting',title:'Standup'},admin.token)).j;assert.match(r.code,/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
 assert.equal((await call('GET','/api/rooms/'+r.code,null,bob.token)).j.ice.length>0,true);assert.equal((await call('GET','/api/rooms/nope-nope-nop',null,bob.token)).status,404);
 const a=await ws(admin.token),b=await ws(bob.token),c=await ws(ann.token);
 send(a,'rtc:join',{code:r.code});await wait(100);send(b,'rtc:join',{code:r.code});await wait(200);
 assert.equal(a.got.some(m=>m.type==='rtc:joined'&&m.payload.id===bob.user.id),true);assert.equal(b.got.find(m=>m.type==='rtc:peers').payload.peers.length,1);
 send(a,'rtc:signal',{to:bob.user.id,data:{sdp:'offer'}});send(b,'rtc:chat',{text:'hello'});send(b,'rtc:chat',{audio:'/uploads/v.webm'});send(a,'rtc:state',{muted:true});await wait(200);
 assert.deepEqual(b.got.find(m=>m.type==='rtc:signal').payload,{from:admin.user.id,data:{sdp:'offer'}});
 assert.equal(a.got.filter(m=>m.type==='rtc:chat').length,2);assert.equal(b.got.find(m=>m.type==='rtc:state').payload.state.muted,true);
 send(c,'rtc:join',{code:r.code});await wait(150);assert.match(c.got.find(m=>m.type==='rtc:error').payload.message,/full/);
 assert.equal((await call('POST',`/api/rooms/${r.code}/end`,{},bob.token)).status,403);
 await call('POST',`/api/rooms/${r.code}/end`,{},admin.token);await wait(150);assert.equal(b.got.some(m=>m.type==='rtc:ended'),true);
 [a,b,c].forEach(x=>x.w.close())});
test('live: listed publicly only while host is connected',async()=>{
 const r=(await call('POST','/api/rooms',{type:'live',mode:'audio',title:'Q&A'},ann.token)).j;assert.equal((await call('GET','/api/rooms/live')).j.length,0);
 const h=await ws(ann.token);send(h,'rtc:join',{code:r.code});await wait(150);
 const l=(await call('GET','/api/rooms/live')).j;assert.equal(l.length,1);assert.equal(l[0].mode,'audio');assert.equal(l[0].host.name,'Ann');
 h.w.close();await wait(200);assert.equal((await call('GET','/api/rooms/live')).j.length,0)});
test('AI assistant: needs login, validates, answers via provider',async()=>{
 assert.equal((await call('POST','/api/ai',{messages:[{role:'user',content:'hi'}]})).status,401);
 assert.equal((await call('POST','/api/ai',{messages:[]},bob.token)).status,400);
 assert.equal((await call('GET','/api/ai/status',null,bob.token)).j.enabled,true);
 assert.equal((await call('POST','/api/ai',{messages:[{role:'user',content:'ping'}]},bob.token)).j.reply,'echo: ping')});
test('public group list hides private groups',async()=>{
 await call('PUT','/api/sync',{baseRev:0,data:{rblink_channels:JSON.stringify([{id:'a',name:'general',isPrivate:false,memberIds:['1','2']},{id:'b',name:'secret',isPrivate:true,memberIds:[]}])}},admin.token);
 const g=(await call('GET','/api/public/groups')).j;assert.deepEqual(g.map(x=>x.name),['general']);assert.equal(g[0].members,2)});

test('live roles: audience by default, host promotes, speaker can step down, host cannot be demoted',async()=>{
 const m=(await call('POST','/api/rooms',{type:'meeting'},admin.token)).j,ma=await ws(admin.token),mb=await ws(bob.token);
 send(ma,'rtc:join',{code:m.code});await wait(100);send(mb,'rtc:join',{code:m.code});await wait(150);
 assert.equal(mb.got.find(x=>x.type==='rtc:peers').payload.peers[0].state.speaker,true);[ma,mb].forEach(x=>x.w.close());await wait(100);
 const r=(await call('POST','/api/rooms',{type:'live',mode:'video',title:'Talk'},ann.token)).j,h=await ws(ann.token),l=await ws(bob.token);
 send(h,'rtc:join',{code:r.code});await wait(150);send(l,'rtc:join',{code:r.code});await wait(200);
 assert.equal(l.got.find(x=>x.type==='rtc:peers').payload.peers[0].state.speaker,true);
 assert.equal(h.got.find(x=>x.type==='rtc:joined').payload.state.speaker,false);
 send(l,'rtc:role',{to:bob.user.id,speaker:true});await wait(150);assert.equal(h.got.some(x=>x.type==='rtc:state'),false);
 send(l,'rtc:state',{hand:true,muted:false});await wait(150);assert.equal(h.got.find(x=>x.type==='rtc:state').payload.state.speaker,false);
 send(h,'rtc:role',{to:bob.user.id,speaker:true});await wait(200);
 const up=l.got.filter(x=>x.type==='rtc:state'&&x.payload.id===bob.user.id).pop();assert.equal(up.payload.state.speaker,true);assert.equal(up.payload.state.hand,false);
 send(l,'rtc:role',{to:bob.user.id,speaker:false});await wait(200);
 assert.equal(h.got.filter(x=>x.type==='rtc:state'&&x.payload.id===bob.user.id).pop().payload.state.speaker,false);
 const before=h.got.length;send(l,'rtc:role',{to:ann.user.id,speaker:false});await wait(150);assert.equal(h.got.length,before);
 [h,l].forEach(x=>x.w.close())});

test('AI assistant: page context is passed as untrusted data and capped; app map is in the system prompt',async()=>{
 const withCtx=(await call('POST','/api/ai',{messages:[{role:'user',content:'whatsys'}],context:'POST: hello world '+'x'.repeat(9000)},bob.token)).j.reply;
 assert.match(withCtx,/rblink\.chat assistant/);assert.match(withCtx,/hello world/);assert.match(withCtx,/untrusted/);assert.ok(withCtx.length<9000);assert.ok(!withCtx.includes('x'.repeat(6500)));
 const none=(await call('POST','/api/ai',{messages:[{role:'user',content:'whatsys'}]},bob.token)).j.reply;
 assert.doesNotMatch(none,/untrusted/);assert.match(none,/\[\[go:PAGE\]\]/);assert.match(none,/market \(browse/);assert.match(none,/jobs\/applied/)});
