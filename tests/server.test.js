// Integration tests: start the real server in a temp dir and exercise auth, sync, uploads and WebSocket.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rblink-')),PORT=4300+Math.floor(Math.random()*500),B=`http://localhost:${PORT}`;
let proc;
const start=()=>new Promise((ok,no)=>{proc=spawn('node',['server/index.js'],{env:{...process.env,PORT,DATA_DIR:dir}});proc.stdout.on('data',d=>/listening/.test(d)&&ok());proc.on('error',no);setTimeout(()=>no(new Error('server start timeout')),8000)});
const stop=()=>new Promise(r=>{proc.on('exit',r);proc.kill('SIGTERM')});
const call=(m,p,b,tok)=>fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Cookie:'rblink_token='+tok}:{})},body:b?JSON.stringify(b):undefined});
const wsOpen=t=>new Promise((ok,no)=>{const w=new WebSocket(`ws://localhost:${PORT}/ws?token=${t}`),got=[];w.onmessage=e=>got.push(JSON.parse(e.data));w.onopen=()=>ok({w,got});w.onerror=()=>no(new Error('ws error'))});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let A,Bu;
test.before(start);test.after(async()=>{await stop();fs.rmSync(dir,{recursive:true,force:true})});
test('health endpoint',async()=>{assert.equal((await (await call('GET','/api/health')).json()).status,'ok')});
test('signup validates input',async()=>{
 assert.equal((await call('POST','/api/auth/signup',{name:'A',email:'bad',password:'longenough',confirmPassword:'longenough'})).status,400);
 assert.equal((await call('POST','/api/auth/signup',{name:'A',email:'a@x.com',password:'short',confirmPassword:'short'})).status,400)});
test('signup, duplicate email, login, wrong password, me',async()=>{
 let r=await call('POST','/api/auth/signup',{name:'Ada',email:'Ada@Example.com',password:'password123',confirmPassword:'password123'});assert.equal(r.status,200);A=await r.json();
 assert.equal(A.user.role,'owner');assert.match(r.headers.get('set-cookie'),/HttpOnly/);
 assert.equal((await call('POST','/api/auth/signup',{name:'Ada2',email:'ada@example.com',password:'password123',confirmPassword:'password123'})).status,409);
 r=await call('POST','/api/auth/signup',{name:'Bob',email:'bob@example.com',password:'password123',confirmPassword:'password123'});Bu=await r.json();assert.equal(Bu.user.role,'member');
 assert.equal((await call('POST','/api/auth/login',{email:'ada@example.com',password:'nope-nope'})).status,401);
 assert.equal((await call('POST','/api/auth/login',{email:'ada@example.com',password:'password123',confirmPassword:'password123'})).status,200);
 assert.equal((await (await call('GET','/api/auth/me',null,A.token)).json()).user.email,'ada@example.com')});
test('private routes need login; forged token rejected',async()=>{
 assert.equal((await call('GET','/api/sync')).status,401);assert.equal((await call('GET','/api/sync',null,A.token+'x')).status,401)});
test('google login reports not configured',async()=>{assert.equal((await call('POST','/api/auth/google',{credential:'x'})).status,501)});
test('sync: save, read, reject stale revision',async()=>{
 const msg=JSON.stringify({c1:[{id:'m1',senderId:A.user.id,content:'hi'}]});let r=await call('PUT','/api/sync',{baseRev:0,data:{rblink_messages:msg}},A.token);assert.equal((await r.json()).rev,1);
 r=await call('PUT','/api/sync',{baseRev:0,data:{rblink_messages:'{}'}},Bu.token);assert.equal(r.status,409);
 const s=await (await call('GET','/api/sync',null,Bu.token)).json();assert.equal(s.rev,1);assert.equal(JSON.parse(s.data.rblink_messages).c1[0].content,'hi')});
test('upload stores allowed files, blocks html, needs login',async()=>{
 const f=new FormData();f.append('files',new Blob(['hello']),'a.txt');f.append('files',new Blob(['x']),'b.txt');
 const r=await fetch(B+'/api/upload',{method:'POST',body:f,headers:{Cookie:'rblink_token='+A.token}}),j=await r.json();
 assert.equal(j.files.length,2);assert.equal(await (await fetch(B+j.files[0].url)).text(),'hello');
 assert.equal((await fetch(B+j.files[1].url)).status,200);
 const bad=new FormData();bad.append('files',new Blob(['<script>1</script>']),'x.html');
 assert.equal((await fetch(B+'/api/upload',{method:'POST',body:bad,headers:{Cookie:'rblink_token='+A.token}})).status,415);
 assert.equal((await fetch(B+'/api/upload',{method:'POST',body:f})).status,401)});
test('path traversal is blocked',async()=>{
 const r=await fetch(B+'/uploads/..%2f..%2fdb.json');assert.equal(r.status,404)});
test('websocket: needs auth, relays to others, blocks spoofing, announces sync',async()=>{
 await assert.rejects(()=>wsOpen('bad'));
 const a=await wsOpen(A.token),b=await wsOpen(Bu.token);
 a.w.send(JSON.stringify({type:'message:new',payload:{id:'m2',senderId:A.user.id}}));
 a.w.send(JSON.stringify({type:'message:new',payload:{id:'evil',senderId:Bu.user.id}}));
 await wait(300);
 assert.deepEqual(b.got.map(m=>m.payload.id),['m2']);assert.equal(a.got.length,0);
 await call('PUT','/api/sync',{baseRev:1,data:{rblink_users:'[]'}},A.token);await wait(300);
 assert.ok(b.got.some(m=>m.type==='sync'&&m.payload.rev===2));a.w.close();b.w.close()});
test('data survives a restart',async()=>{
 await stop();await start();
 assert.equal((await call('POST','/api/auth/login',{email:'bob@example.com',password:'password123',confirmPassword:'password123'})).status,200);
 const s=await (await call('GET','/api/sync',null,A.token)).json();assert.equal(s.rev,2)});

test('upload accepts a photo with no file extension (uses its type) and health reports storage',async()=>{
 const f=new FormData();f.append('files',new Blob(['x'],{type:'image/jpeg'}),'camera-photo');
 const r=await fetch(B+'/api/upload',{method:'POST',body:f,headers:{Cookie:'rblink_token='+A.token}}),j=await r.json();
 assert.equal(r.status,200);assert.match(j.files[0].url,/\.jpg$/);
 const f2=new FormData();f2.append('files',new Blob(['x'],{type:'image/heic'}),'IMG_1.HEIC');
 assert.equal((await fetch(B+'/api/upload',{method:'POST',body:f2,headers:{Cookie:'rblink_token='+A.token}})).status,200);
 assert.equal((await (await call('GET','/api/health')).json()).storage,'ok')});

test('uploads require auth and message APIs are permission-checked',async()=>{
 const C=await (await call('POST','/api/auth/signup',{name:'Cara',email:'cara@example.com',password:'password123',confirmPassword:'password123'})).json();
 const f=new FormData();f.append('files',new Blob(['secret']),'private.txt');
 const up=await (await fetch(B+'/api/upload',{method:'POST',body:f,headers:{Cookie:'rblink_token='+A.token}})).json();
 assert.equal((await fetch(B+up.files[0].url)).status,401);
 assert.equal((await fetch(B+up.files[0].url,{headers:{Cookie:'rblink_token='+A.token}})).status,200);

 const dmId=(await (await call('POST','/api/dms',{userId:Bu.user.id},A.token)).json()).id;
 await call('PUT','/api/sync',{baseRev:2,data:{rblink_messages:JSON.stringify({[dmId]:[{id:'secret_msg',senderId:A.user.id,content:'private note',timestamp:'2026-05-01T00:00:00Z'}]})}},A.token);
 const ok=(await call('GET','/api/messages/secret_msg',null,Bu.token));assert.equal(ok.status,200);assert.equal((await ok.json()).content,'private note');
 assert.equal((await call('GET','/api/messages/secret_msg',null,C.token)).status,404);
 const edit=await call('PATCH','/api/messages/secret_msg',{content:'updated'},A.token);assert.equal(edit.status,200);assert.equal((await edit.json()).content,'updated');
 const del=await call('DELETE','/api/messages/secret_msg',null,A.token);assert.equal(del.status,200);
 assert.equal((await call('GET','/api/messages/secret_msg',null,Bu.token)).status,404);
});
