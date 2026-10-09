// A failing disk save (for example a Windows file lock) must never turn a request into an error.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rblink-res-')),PORT=5400+Math.floor(Math.random()*400),B=`http://localhost:${PORT}`;
let proc,out='';
test.before(()=>new Promise((ok,no)=>{proc=spawn('node',['server/index.js'],{env:{...process.env,PORT,DATA_DIR:dir,NODE_ENV:'development'}});proc.stdout.on('data',d=>{out+=d;/listening/.test(d)&&ok()});proc.stderr.on('data',d=>out+=d);setTimeout(()=>no(new Error('timeout')),8000)}));
test.after(async()=>{await new Promise(r=>{proc.on('exit',r);proc.kill('SIGTERM')});fs.rmSync(dir,{recursive:true,force:true})});
const post=(p,b,c)=>fetch(B+p,{method:'POST',headers:{'Content-Type':'application/json',...(c?{Cookie:c}:{})},body:JSON.stringify(b)});
test('requests still succeed when the database file cannot be written',async()=>{
 const ok=await post('/api/auth/signup',{name:'R',email:'r@x.com',password:'password123',confirmPassword:'password123'});assert.equal(ok.status,200);
 const cookie=ok.headers.get('set-cookie').split(';')[0];
 fs.rmSync(path.join(dir,'db.json'),{force:true});fs.mkdirSync(path.join(dir,'db.json'));fs.writeFileSync(path.join(dir,'db.json','keep'),'x'); // make saving impossible
 assert.equal((await post('/api/auth/forgot',{email:'r@x.com'})).status,200);
 assert.equal((await post('/api/auth/phone/start',{phone:'+2348012345678'})).status,200);
 const p=await fetch(B+'/api/me/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({headline:'Hi'})});assert.equal(p.status,200);
 assert.equal((await post('/api/posts',{text:'hello',category:'news'},cookie)).status,200);
 const h=await (await fetch(B+'/api/health')).json();assert.match(h.storage,/^error/);
 assert.match(out,/could not save/)});
test('a malformed request gets a clear 400, not a crash',async()=>{
 const r=await fetch(B+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{oops'});assert.equal(r.status,400);
 assert.equal((await fetch(B+'/api/health')).status,200)});
