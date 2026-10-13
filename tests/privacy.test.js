// Step 5: sample-data removal, private chat sync, live-event privacy, notifications and inbox.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rblink-priv-')),PORT=7100+Math.floor(Math.random()*400),B=`http://localhost:${PORT}`;
// pre-load a database that still contains the old sample data, to prove it is removed at startup
const demo={rblink_users:JSON.stringify([{id:'u1',name:'Sarah Chen'},{id:'u5',name:'Marcus Vance'}]),
 rblink_channels:JSON.stringify([{id:'c_general',name:'general',isPrivate:false,createdBy:'u5',memberIds:['u1','u5'],description:'old'},{id:'c_announcements',name:'announcements',isPrivate:false,memberIds:['u1']}]),
 rblink_dms:JSON.stringify([{id:'dm_u1_u2',participantIds:['u1','u2']}]),
 rblink_messages:JSON.stringify({c_general:[{id:'d1',senderId:'u1',content:'old demo',timestamp:'2026-01-01T00:00:00Z'}],c_announcements:[{id:'d2',senderId:'u5',content:'x',timestamp:'2026-01-01T00:00:00Z'}]})};
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify({secret:'s'.repeat(40),users:[],rev:3,sync:demo}));
let proc;
const start=()=>new Promise((ok,no)=>{proc=spawn('node',['server/index.js'],{env:{...process.env,PORT,DATA_DIR:dir}});proc.stdout.on('data',d=>/listening/.test(d)&&ok());setTimeout(()=>no(new Error('timeout')),8000)});
const call=async(m,p,b,t)=>{const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(t?{Cookie:'rblink_token='+t}:{})},body:b?JSON.stringify(b):undefined});let j={};try{j=await r.json()}catch{}return{status:r.status,j}};
const signup=async(n)=>(await call('POST','/api/auth/signup',{name:n,email:n.toLowerCase()+'@x.com',password:'password123',confirmPassword:'password123'})).j;
const ws=t=>new Promise((ok,no)=>{const w=new WebSocket(`ws://localhost:${PORT}/ws?token=${t}`),got=[];w.onmessage=e=>got.push(JSON.parse(e.data));w.onopen=()=>ok({w,got});w.onerror=()=>no(new Error('ws'))});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const get=async t=>{const r=(await call('GET','/api/sync',null,t)).j;return{rev:r.rev,users:JSON.parse(r.data.rblink_users||'[]'),chans:JSON.parse(r.data.rblink_channels||'[]'),dms:JSON.parse(r.data.rblink_dms||'[]'),msgs:JSON.parse(r.data.rblink_messages||'{}')}};
const put=async(t,data)=>{const rev=(await call('GET','/api/sync',null,t)).j.rev;return (await call('PUT','/api/sync',{baseRev:rev,data:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,JSON.stringify(v)]))},t))};
let ann,bob,cy;
test.before(async()=>{await start();ann=await signup('Ann');bob=await signup('Bob');cy=await signup('Cy')});
test.after(async()=>{await new Promise(r=>{proc.on('exit',r);proc.kill('SIGTERM')});fs.rmSync(dir,{recursive:true,force:true})});

test('old sample users, groups, DMs and messages are removed at startup',async()=>{
 const s=await get(ann.token);assert.equal(s.users.some(u=>/^u[1-6]$/.test(u.id)),false);
 assert.deepEqual(s.chans.map(c=>c.id),['c_general']);assert.equal(s.chans[0].description.startsWith('Welcome'),true);assert.equal(s.chans[0].createdBy,'');
 assert.equal(s.dms.length,0);assert.deepEqual(s.msgs.c_general,[]);assert.equal(s.msgs.c_announcements,undefined)});
test('old sample data cannot come back from an old browser',async()=>{
 await put(ann.token,{rblink_users:[{id:'u1',name:'Sarah Chen'}],rblink_messages:{c_general:[{id:'zz',senderId:'u1',content:'back',timestamp:'2026-02-01T00:00:00Z'}]}});
 const s=await get(ann.token);assert.equal(s.users.some(u=>u.id==='u1'),false);assert.equal((s.msgs.c_general||[]).length,0)});

let dm,priv;
test('direct messages and private groups are only visible to their members',async()=>{
 dm=(await call('POST','/api/dms',{userId:bob.user.id},ann.token)).j.id;assert.match(dm,/^dm_/);
 assert.equal((await call('POST','/api/dms',{userId:ann.user.id},bob.token)).j.id,dm);      // same chat, not a duplicate
 assert.equal((await call('POST','/api/dms',{userId:ann.user.id},ann.token)).status,400);
 const a=await get(ann.token),c=await get(cy.token);
 assert.equal(a.dms.length,1);assert.equal(c.dms.length,0);
 priv='c_secret';await put(ann.token,{rblink_channels:[...a.chans,{id:priv,name:'secret',isPrivate:true,isArchived:false,memberIds:[ann.user.id,bob.user.id]}],
  rblink_messages:{[dm]:[{id:'m1',senderId:ann.user.id,content:'hello bob',timestamp:'2026-03-01T10:00:00Z',dmId:dm}],[priv]:[{id:'m2',senderId:ann.user.id,content:'secret plan',timestamp:'2026-03-01T10:01:00Z',channelId:priv}]}});
 const b=await get(bob.token),c2=await get(cy.token);
 assert.equal(b.msgs[dm][0].content,'hello bob');assert.equal(b.chans.some(x=>x.id===priv),true);
 assert.equal(c2.msgs[dm],undefined);assert.equal(c2.msgs[priv],undefined);assert.equal(c2.chans.some(x=>x.id===priv),false);assert.equal(c2.dms.length,0)});
test('emails of other members are not shared with the chat',async()=>{
 await put(cy.token,{rblink_users:[{id:cy.user.id,name:'Cy',role:'owner',email:'fake@evil.com'}]});const c=await get(cy.token);assert.equal(c.users.find(u=>u.id===cy.user.id).email,'cy@x.com');assert.equal(c.users.find(u=>u.id===cy.user.id).role,'member');assert.ok(c.users.filter(u=>u.id!==cy.user.id).every(u=>u.email===''))});
test('an outsider cannot read, overwrite, impersonate or delete in private chats',async()=>{
 const a=await get(ann.token);
 // Cy tries to forge messages in the DM, rewrite Ann's message, post as Ann, and take over the private group
 await put(cy.token,{rblink_messages:{[dm]:[{id:'evil',senderId:cy.user.id,content:'i am in',timestamp:'2026-03-02T00:00:00Z'}],[priv]:[]},
  rblink_channels:[{id:priv,name:'secret',isPrivate:false,memberIds:[cy.user.id]},{id:'c_general',name:'general',isPrivate:false,memberIds:[]}],
  rblink_dms:[{id:dm,participantIds:[cy.user.id]}]});
 const a2=await get(ann.token);
 assert.deepEqual(a2.msgs[dm].map(m=>m.id),['m1']);assert.equal(a2.chans.find(c=>c.id===priv).isPrivate,true);assert.deepEqual(a2.dms.find(d=>d.id===dm).participantIds.sort(),[ann.user.id,bob.user.id].sort());
 // inside a conversation Cy can see: cannot post as someone else or edit/delete other people's messages
 await put(ann.token,{rblink_messages:{c_general:[{id:'g1',senderId:ann.user.id,content:'public hello',timestamp:'2026-03-03T00:00:00Z'}]}});
 await put(cy.token,{rblink_messages:{c_general:[{id:'g1',senderId:cy.user.id,content:'HACKED',timestamp:'2026-03-03T00:00:00Z',reactions:[{emoji:'x',userIds:[cy.user.id]}]},{id:'g2',senderId:ann.user.id,content:'fake',timestamp:'2026-03-03T00:01:00Z'}]}});
 const g=(await get(ann.token)).msgs.c_general;assert.equal(g.find(m=>m.id==='g1').content,'public hello');assert.equal(g.find(m=>m.id==='g1').senderId,ann.user.id);assert.equal(g.some(m=>m.id==='g2'),false);
 await put(cy.token,{rblink_messages:{c_general:[]}});assert.equal((await get(ann.token)).msgs.c_general.some(m=>m.id==='g1'),true)});
test('live chat events only reach the people in that conversation',async()=>{
 const a=await ws(ann.token),b=await ws(bob.token),c=await ws(cy.token);
 a.w.send(JSON.stringify({type:'message:new',payload:{id:'m9',senderId:ann.user.id,dmId:dm,content:'private ping'}}));
 a.w.send(JSON.stringify({type:'message:new',payload:{id:'m10',senderId:ann.user.id,channelId:'c_general',content:'public ping'}}));
 c.w.send(JSON.stringify({type:'message:new',payload:{id:'m11',senderId:cy.user.id,dmId:dm,content:'intruder'}}));await wait(300);
 assert.deepEqual(b.got.map(m=>m.payload.id).sort(),['m10','m9']);assert.deepEqual(c.got.map(m=>m.payload.id),['m10']);assert.equal(a.got.some(m=>m.payload&&m.payload.id==='m11'),false);
 [a,b,c].forEach(x=>x.w.close())});

test('notifications: direct messages and inbox with unread counts, read marking',async()=>{
 assert.equal((await call('GET','/api/notifications/summary',null,bob.token)).j.inbox,1);
 const n=(await call('GET','/api/notifications',null,bob.token)).j;const dmN=n.items.find(x=>x.type==='dm');
 assert.equal(dmN.actor.name,'Ann');assert.equal(dmN.text,'hello bob');assert.equal(dmN.ref,dm);assert.equal(dmN.key,undefined);
 const inbox=(await call('GET','/api/inbox',null,bob.token)).j;assert.equal(inbox[0].others[0].name,'Ann');assert.equal(inbox[0].unread,1);assert.equal(inbox[0].last.content,'hello bob');
 assert.equal((await call('GET','/api/inbox',null,cy.token)).j.length,0);
 await call('POST','/api/inbox/read',{id:dm},bob.token);
 assert.equal((await call('GET','/api/inbox',null,bob.token)).j[0].unread,0);assert.equal((await call('GET','/api/notifications/summary',null,bob.token)).j.unread,0);
 await call('POST','/api/inbox/read',{id:dm},cy.token);   // outsider: ignored, no error
 assert.equal((await call('GET','/api/inbox',null,ann.token)).j[0].unread,0)});
test('notifications: comments, replies, reactions, reshares, WhatsApp requests and approvals',async()=>{
 await call('PATCH','/api/me/profile',{socials:{whatsapp:'+2348011111111'}},ann.token);
 const p=(await call('POST','/api/posts',{text:'hello world',category:'news'},ann.token)).j;
 await call('POST',`/api/posts/${p.id}/react`,{emoji:'🔥'},bob.token);await call('POST',`/api/posts/${p.id}/react`,{emoji:'🔥'},bob.token);await call('POST',`/api/posts/${p.id}/react`,{emoji:'🔥'},bob.token);
 const c1=(await call('POST',`/api/posts/${p.id}/comments`,{text:'nice one'},bob.token)).j;
 await call('POST',`/api/posts/${p.id}/comments`,{audio:'/uploads/v.webm',parentId:c1.id},ann.token);   // Ann replies to Bob (voice)
 await call('POST',`/api/comments/${c1.id}/react`,{emoji:'❤️'},cy.token);
 await call('POST','/api/posts',{reshareOf:p.id,text:''},cy.token);
 await call('POST',`/api/users/${ann.user.id}/whatsapp-request`,{},bob.token);
 const a=(await call('GET','/api/notifications',null,ann.token)).j.items.map(x=>x.type).sort();
 assert.deepEqual(a,['comment','reaction_post','reshare','whatsapp_request']);                        // one reaction notification, no self-notifications
 const b=(await call('GET','/api/notifications',null,bob.token)).j.items.map(x=>x.type);
 assert.ok(b.includes('reply')&&b.includes('reaction_comment'));
 const ar=(await call('GET','/api/notifications',null,ann.token)).j.items;assert.equal(ar.find(x=>x.type==='comment').link,'post/'+p.id);assert.match(ar.find(x=>x.type==='comment').text,/nice one/);
 const wr=(await call('GET','/api/whatsapp-requests',null,ann.token)).j[0];await call('POST','/api/whatsapp-requests/'+wr.id,{approve:true},ann.token);
 assert.ok((await call('GET','/api/notifications',null,bob.token)).j.items.some(x=>x.type==='whatsapp_approved'));
 const s0=(await call('GET','/api/notifications/summary',null,ann.token)).j.unread;assert.equal(s0,4);
 await call('POST','/api/notifications/read',{id:ar[0].id},ann.token);assert.equal((await call('GET','/api/notifications/summary',null,ann.token)).j.unread,3);
 assert.equal((await call('POST','/api/notifications/read',{all:true},bob.token)).j.unread,0);assert.equal((await call('GET','/api/notifications/summary',null,ann.token)).j.unread,3)});
test('notifications for job applications, and @mentions respect privacy',async()=>{
 assert.equal((await call('GET','/api/notifications')).status,401);
 const a=await get(ann.token);
 await put(ann.token,{rblink_messages:{[priv]:[...(a.msgs[priv]||[]),{id:'m3',senderId:ann.user.id,content:'hey both',timestamp:'2026-03-05T00:00:00Z',channelId:priv,mentions:[bob.user.id,cy.user.id]}]}});
 const b=(await call('GET','/api/notifications',null,bob.token)).j.items,c=(await call('GET','/api/notifications',null,cy.token)).j.items;
 assert.ok(b.some(x=>x.type==='mention'&&x.ref===priv));assert.equal(c.some(x=>x.type==='mention'),false)});
test('cross-site requests are blocked in production mode',async()=>{
 const p2=spawn('node',['server/index.js'],{env:{...process.env,PORT:PORT+1,DATA_DIR:fs.mkdtempSync(path.join(os.tmpdir(),'rblink-x-')),NODE_ENV:'production',SESSION_SECRET:'z'.repeat(40)}});
 await new Promise(r=>p2.stdout.on('data',d=>/listening/.test(d)&&r()));
 const post=o=>fetch(`http://localhost:${PORT+1}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json',...(o?{Origin:o}:{})},body:JSON.stringify({email:'a@x.com',password:'wrongwrong'})}).then(r=>r.status);
 assert.equal(await post('https://evil.example'),403);assert.equal(await post(`http://localhost:${PORT+1}`),401);assert.equal(await post(),401);
 await new Promise(r=>{p2.on('exit',r);p2.kill('SIGTERM')})});
