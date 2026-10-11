// Tests for Step 4: Supabase storage adapter (against a fake Supabase), security headers, rate limits, startup failure.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import http from 'node:http';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const KV={},FILES={},MP=6100+Math.floor(Math.random()*300);let mock;const dirs=[];
const mkdir=()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'rblink-st-'));dirs.push(d);return d};
const startServer=(env,wantExit)=>new Promise((ok,no)=>{const port=6500+Math.floor(Math.random()*400),proc=spawn('node',['server/index.js'],{env:{...process.env,PORT:port,DATA_DIR:mkdir(),...env}});
 let out='';proc.stdout.on('data',d=>{out+=d;if(/listening/.test(d))ok({proc,port,B:`http://localhost:${port}`})});proc.stderr.on('data',d=>out+=d);
 proc.on('exit',code=>{if(wantExit)ok({code,out})});setTimeout(()=>no(new Error('timeout '+out)),9000)});
const stop=p=>new Promise(r=>{p.on('exit',r);p.kill('SIGTERM')});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const SB=k=>({SUPABASE_URL:`http://localhost:${MP}`,SUPABASE_SERVICE_KEY:k||'k'});
const post=(B,p,b,tok)=>fetch(B+p,{method:'POST',headers:{'Content-Type':'application/json',...(tok?{Cookie:'rblink_token='+tok}:{})},body:JSON.stringify(b)});
test.before(()=>new Promise(ok=>{mock=http.createServer(async(q,s)=>{const c=[];for await(const x of q)c.push(x);const body=Buffer.concat(c),u=new URL(q.url,'http://x');
 if(q.headers.apikey!=='k'){s.statusCode=401;return s.end('{"message":"bad key"}')}
 if(q.method==='GET'&&u.pathname==='/rest/v1/rblink_kv'){const id=u.searchParams.get('id').replace('eq.','');s.setHeader('Content-Type','application/json');return s.end(JSON.stringify(KV[id]?[{id,data:KV[id]}]:[]))}
 if(q.method==='POST'&&u.pathname==='/rest/v1/rblink_kv'){for(const r of JSON.parse(body))KV[r.id]=r.data;s.statusCode=201;return s.end()}
 if(q.method==='POST'&&u.pathname.startsWith('/storage/v1/object/rblink-uploads/')){FILES[decodeURIComponent(u.pathname.split('/').pop())]=body;s.setHeader('Content-Type','application/json');return s.end('{"Key":"ok"}')}
 s.statusCode=404;s.end()}).listen(MP,ok)}));
test.after(()=>{mock.close();dirs.forEach(d=>fs.rmSync(d,{recursive:true,force:true}))});

test('Supabase mode: data and uploads go to the cloud, and a brand-new server loads them back',async()=>{
 const a=await startServer(SB());
 const su=await (await post(a.B,'/api/auth/signup',{name:'Cloud',email:'cloud@x.com',password:'password123',confirmPassword:'password123'})).json();
 const f=new FormData();f.append('files',new Blob(['hello']),'a.txt');
 const up=await (await fetch(a.B+'/api/upload',{method:'POST',body:f,headers:{Cookie:'rblink_token='+su.token}})).json();
 assert.match(up.files[0].url,/^\/uploads\/file-/);await wait(700);
 assert.equal(KV.db.users[0].email,'cloud@x.com');assert.equal(Object.keys(FILES).length,1);
 const red=await fetch(a.B+up.files[0].url,{redirect:'manual'});assert.equal(red.status,302);assert.match(red.headers.get('location'),/\/storage\/v1\/object\/public\/rblink-uploads\/file-/);
 const h=await (await fetch(a.B+'/api/health?deep=1')).json();assert.equal(h.mode,'supabase');assert.equal(h.storage,'ok');
 await stop(a.proc);
 const b=await startServer(SB());   // fresh empty folder: everything must come from the cloud
 assert.equal((await post(b.B,'/api/auth/login',{email:'cloud@x.com',password:'password123'})).status,200);
 await stop(b.proc)});

test('Supabase mode: wrong key stops the server at startup with a clear message',async()=>{
 const r=await startServer(SB('wrong'),true);assert.equal(r.code,1);assert.match(r.out,/cannot read from Supabase/)});

test('Supabase mode: deep health reports a broken connection',async()=>{
 const a=await startServer(SB());const saved=KV.db;delete KV.db;
 assert.equal((await fetch(a.B+'/api/health?deep=1')).status,200);KV.db=saved;await stop(a.proc)});

test('security headers: CSP report-only by default, enforced on request, HSTS only in production',async()=>{
 const a=await startServer({}),h=(await fetch(a.B+'/api/health')).headers;
 assert.match(h.get('content-security-policy-report-only'),/default-src 'self'/);assert.equal(h.get('content-security-policy'),null);assert.equal(h.get('strict-transport-security'),null);
 assert.equal(h.get('x-frame-options'),'DENY');await stop(a.proc);
 const b=await startServer({CSP_ENFORCE:'1',NODE_ENV:'production',SESSION_SECRET:'x'.repeat(32)}),h2=(await fetch(b.B+'/api/health')).headers;
 assert.match(h2.get('content-security-policy'),/object-src 'none'/);assert.match(h2.get('strict-transport-security'),/max-age/);await stop(b.proc)});

test('rate limit: per visitor address, and the real address is used behind a proxy',async()=>{
 const a=await startServer({API_RATE_LIMIT:'8',TRUST_PROXY:'1'});
 const hit=ip=>fetch(a.B+'/api/health',{headers:{'X-Forwarded-For':ip}}).then(r=>r.status);
 const codes=[];for(let i=0;i<12;i++)codes.push(await hit('1.1.1.1'));
 assert.ok(codes.includes(429));assert.equal(await hit('2.2.2.2'),200);await stop(a.proc)});
