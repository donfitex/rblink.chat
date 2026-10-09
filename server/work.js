// Marketplace + job board (approved recruiters only) + job applications.
import crypto from 'crypto';
export const MARKET_CATEGORIES=['electronics','phones','vehicles','property','fashion','home','beauty','services','food','agriculture','education','sports','other'];
const FIELDS=['email','fullName','phone','yearsExperience','currentEmployer','currentPosition','cv','coverLetter','linkedin','portfolio','expectedSalary'];
export default function(R,c){
 const{db,flush,save,send,json,sendMail}=c,id=p=>p+'_'+crypto.randomBytes(6).toString('hex');
 for(const k of['market','jobs','apps','recruitReq'])db[k]??=[];
 const open=(k,f)=>{f.open=true;R[k]=f},isAdmin=u=>u&&(u.role==='owner'||u.role==='admin'),str=(v,n)=>String(v??'').trim().slice(0,n);
 const user=i=>db.users.find(x=>x.id===i),au=i=>{const x=user(i);return x?{id:x.id,name:x.name,avatar:x.avatar||''}:{id:i,name:'Deleted user',avatar:''}};
 const imgs=a=>(Array.isArray(a)?a:[]).filter(x=>/^\/uploads\/[\w.-]+$/.test(x)).slice(0,10);
 const url=v=>{v=str(v,300);if(!v)return'';if(!/^https?:\/\//i.test(v))v='https://'+v;try{new URL(v);return v}catch{return''}};
 // ----- marketplace
 open('GET /api/market/categories',(q,s)=>send(s,200,MARKET_CATEGORIES));
 open('GET /api/market',(q,s,u,P,x)=>{const g=k=>x.searchParams.get(k)||'',t=g('q').toLowerCase(),cat=g('category'),co=g('country').toLowerCase(),ci=g('city').toLowerCase(),min=g('min')?+g('min'):null,max=g('max')?+g('max'):null,cond=g('condition'),sort=g('sort');
  const sel=g('seller');
  let l=db.market.filter(m=>(m.status==='active'||(!!u&&sel===u.id))&&(!sel||m.sellerId===sel)&&(!t||(m.title+' '+m.description).toLowerCase().includes(t))&&(!cat||m.category===cat)&&(!co||m.country.toLowerCase()===co)&&(!ci||m.city.toLowerCase().includes(ci))&&(min===null||m.price>=min)&&(max===null||m.price<=max)&&(!cond||m.condition===cond));
  l=l.sort(sort==='price_asc'?(a,b)=>a.price-b.price:sort==='price_desc'?(a,b)=>b.price-a.price:(a,b)=>b.createdAt.localeCompare(a.createdAt));
  send(s,200,{total:l.length,items:l.slice(+g('offset')||0,(+g('offset')||0)+(+g('limit')||24)).map(m=>({...m,seller:au(m.sellerId)}))})});
 open('GET /api/market/:id',(q,s,u,P)=>{const m=db.market.find(x=>x.id===P.id);m?send(s,200,{...m,seller:au(m.sellerId)}):send(s,404,{error:'Listing not found'})});
 const listing=b=>{const price=+b.price;if(!str(b.title,120))return'Add a title';if(!(price>=0))return'Enter a valid price';if(!str(b.country,60))return'Choose a country';return''};
 R['POST /api/market']=async(q,s,u)=>{const b=await json(q),e=listing(b);if(e)return send(s,400,{error:e});
  const m={id:id('m'),sellerId:u.id,title:str(b.title,120),description:str(b.description,3000),price:+b.price,currency:str(b.currency,3).toUpperCase()||'USD',category:MARKET_CATEGORIES.includes(b.category)?b.category:'other',condition:['new','used'].includes(b.condition)?b.condition:'new',country:str(b.country,60),city:str(b.city,60),images:imgs(b.images),status:'active',createdAt:new Date().toISOString()};
  db.market.push(m);save();send(s,200,m)};
 R['PATCH /api/market/:id']=async(q,s,u,P)=>{const m=db.market.find(x=>x.id===P.id);if(!m)return send(s,404,{error:'Not found'});if(m.sellerId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  const b=await json(q);if(b.status&&['active','sold'].includes(b.status))m.status=b.status;for(const[k,n]of[['title',120],['description',3000],['city',60],['country',60]])if(b[k]!==undefined)m[k]=str(b[k],n);if(b.price!==undefined&&+b.price>=0)m.price=+b.price;if(b.images)m.images=imgs(b.images);save();send(s,200,m)};
 R['DELETE /api/market/:id']=(q,s,u,P)=>{const m=db.market.find(x=>x.id===P.id);if(!m)return send(s,404,{error:'Not found'});if(m.sellerId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});db.market=db.market.filter(x=>x!==m);save();send(s,200,{ok:true})};
 // ----- recruiter approval
 R['POST /api/recruiter/request']=async(q,s,u)=>{if(u.recruiter||isAdmin(u))return send(s,200,{status:'approved'});const b=await json(q);let r=db.recruitReq.find(x=>x.userId===u.id&&x.status==='pending');
  if(!r)db.recruitReq.push(r={id:id('rr'),userId:u.id,company:str(b.company,100),note:str(b.note,500),status:'pending',at:Date.now()});flush();send(s,200,{status:'pending'})};
 R['GET /api/recruiter/status']=(q,s,u)=>send(s,200,{status:u.recruiter||isAdmin(u)?'approved':db.recruitReq.some(x=>x.userId===u.id&&x.status==='pending')?'pending':'none'});
 R['GET /api/admin/recruiters']=(q,s,u)=>isAdmin(u)?send(s,200,db.recruitReq.filter(x=>x.status==='pending').map(x=>({...x,user:au(x.userId)}))):send(s,403,{error:'Admins only'});
 R['POST /api/admin/recruiters/:id']=async(q,s,u,P)=>{if(!isAdmin(u))return send(s,403,{error:'Admins only'});const r=db.recruitReq.find(x=>x.id===P.id);if(!r)return send(s,404,{error:'Not found'});
  const ok=!!(await json(q)).approve;r.status=ok?'approved':'denied';const t=user(r.userId);if(t)t.recruiter=ok;flush();send(s,200,{status:r.status})};
 // ----- jobs
 const normForm=f=>{const out={fields:{},custom:[]};for(const k of FIELDS)out.fields[k]={on:!!f?.fields?.[k]?.on,req:!!f?.fields?.[k]?.req};
  out.fields.email={on:true,req:true};out.fields.fullName={on:true,req:true};for(const k of FIELDS)if(!out.fields[k].on)out.fields[k].req=false;
  out.custom=(Array.isArray(f?.custom)?f.custom:[]).slice(0,10).map((x,i)=>({id:'q'+i,label:str(x.label,150),req:!!x.req})).filter(x=>x.label);return out};
 const expired=j=>j.closed||(j.endDate&&new Date(j.endDate+'T23:59:59')<new Date());
 const pj=(j,full)=>{const{applyEmail,...r}=j;return{...r,poster:au(j.posterId),expired:!!expired(j),applyEmail:full?applyEmail:undefined,applicants:db.apps.filter(a=>a.jobId===j.id).length}};
 open('GET /api/jobs',(q,s,u,P,x)=>{const g=k=>x.searchParams.get(k)||'',t=g('q').toLowerCase(),lo=g('location').toLowerCase();
  const l=db.jobs.filter(j=>(g('mine')&&u?j.posterId===u.id:!expired(j))&&(!t||(j.title+' '+j.company+' '+j.description).toLowerCase().includes(t))&&(!lo||j.location.toLowerCase().includes(lo)||(lo==='remote'&&j.remote))&&(!g('level')||j.level===g('level'))&&(!g('type')||j.type===g('type')));
  send(s,200,l.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(j=>pj(j,false)))});
 open('GET /api/jobs/:id',(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j)return send(s,404,{error:'Job not found'});send(s,200,{...pj(j,!!u&&(j.posterId===u.id||isAdmin(u))),applied:!!u&&db.apps.some(a=>a.jobId===j.id&&a.userId===u.id)})});
 R['POST /api/jobs']=async(q,s,u)=>{if(!u.recruiter&&!isAdmin(u))return send(s,403,{error:'Only approved recruiters can post jobs. Request approval first.'});
  const b=await json(q);if(!str(b.title,120)||!str(b.company,100)||!str(b.description,6000))return send(s,400,{error:'Job title, company and description are required'});
  const ce=str(b.cvEmail,120);if(ce&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ce))return send(s,400,{error:'Enter a valid CV email'});
  const em=str(b.applyEmail,120);if(em&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return send(s,400,{error:'Enter a valid application email'});
  const j={id:id('j'),posterId:u.id,cvEmail:ce,title:str(b.title,120),company:str(b.company,100),location:str(b.location,100),remote:!!b.remote,type:['full-time','part-time','contract','internship','freelance'].includes(b.type)?b.type:'full-time',
   level:['entry','mid','senior','lead','executive'].includes(b.level)?b.level:'mid',salary:str(b.salary,60),description:str(b.description,6000),endDate:/^\d{4}-\d{2}-\d{2}$/.test(b.endDate||'')?b.endDate:'',image:imgs([b.image])[0]||'',
   applyEmail:em||u.email||'',website:url(b.website),applyMode:['form','external','none'].includes(b.applyMode)?b.applyMode:'form',formUrl:url(b.formUrl),form:normForm(b.form),closed:false,createdAt:new Date().toISOString()};
  db.jobs.push(j);save();send(s,200,pj(j,true))};
 R['PATCH /api/jobs/:id']=async(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j)return send(s,404,{error:'Not found'});if(j.posterId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});const b=await json(q);if(b.closed!==undefined)j.closed=!!b.closed;save();send(s,200,pj(j,true))};
 R['DELETE /api/jobs/:id']=(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j)return send(s,404,{error:'Not found'});if(j.posterId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});db.jobs=db.jobs.filter(x=>x!==j);db.apps=db.apps.filter(a=>a.jobId!==j.id);save();send(s,200,{ok:true})};
 const LABEL={email:'Email',fullName:'Full name',phone:'Phone',yearsExperience:'Years of experience',currentEmployer:'Current employer',currentPosition:'Current position',cv:'CV',coverLetter:'Cover letter',linkedin:'LinkedIn',portfolio:'Portfolio',expectedSalary:'Expected salary'};
 R['POST /api/jobs/:id/apply']=async(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j||expired(j))return send(s,404,{error:'This job is no longer accepting applications'});
  if(db.apps.some(a=>a.jobId===j.id&&a.userId===u.id))return send(s,409,{error:'You have already applied for this job'});
  const b=await json(q),a=b.answers||{},ans={},miss=[];
  for(const k of FIELDS){const f=j.form.fields[k];if(!f.on)continue;let v=str(a[k],k==='coverLetter'?5000:300);
   if(k==='cv'){if(v&&!/^\/uploads\/[\w.-]+$/.test(v)&&!/^https:\/\/(drive\.google\.com|docs\.google\.com|www\.dropbox\.com|dropbox\.com|onedrive\.live\.com|1drv\.ms)\//i.test(v))return send(s,400,{error:'CV must be an uploaded file or a Google Drive / Dropbox / OneDrive link'})}
   if(k==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return send(s,400,{error:'Enter a valid email'});
   if(f.req&&!v)miss.push(LABEL[k]);ans[k]=v}
  const cu={};for(const x of j.form.custom){const v=str((b.custom||{})[x.id],1000);if(x.req&&!v)miss.push(x.label);cu[x.label]=v}
  if(miss.length)return send(s,400,{error:'Please complete: '+miss.join(', ')});
  const app={id:id('a'),jobId:j.id,userId:u.id,status:'new',answers:ans,custom:cu,createdAt:new Date().toISOString()};db.apps.push(app);flush();
  const origin=`${q.headers['x-forwarded-proto']||'http'}://${q.headers.host}`,cvl=ans.cv?(ans.cv.startsWith('/')?origin+ans.cv:ans.cv):'';
  const lines=[...Object.entries(ans).filter(([k,v])=>v&&k!=='cv').map(([k,v])=>`${LABEL[k]}: ${v}`),...Object.entries(cu).map(([k,v])=>`${k}: ${v}`),cvl&&`CV: ${cvl}`].filter(Boolean);
  if(j.applyEmail)sendMail({to:j.applyEmail,subject:`New application: ${j.title} - ${ans.fullName}`,text:`New application for "${j.title}" at ${j.company}\n\n${lines.join('\n')}`});
  send(s,200,{ok:true})};
 R['GET /api/jobs/:id/applications']=(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j)return send(s,404,{error:'Not found'});if(j.posterId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});send(s,200,db.apps.filter(a=>a.jobId===j.id).map(a=>({...a,applicant:au(a.userId)})))};
 R['PATCH /api/jobs/:id/applications/:aid']=async(q,s,u,P)=>{const j=db.jobs.find(x=>x.id===P.id);if(!j)return send(s,404,{error:'Not found'});if(j.posterId!==u.id&&!isAdmin(u))return send(s,403,{error:'Not allowed'});
  const a=db.apps.find(x=>x.id===P.aid&&x.jobId===j.id);if(!a)return send(s,404,{error:'Application not found'});const st=(await json(q)).status;if(!['new','shortlisted','rejected'].includes(st))return send(s,400,{error:'Invalid status'});a.status=st;flush();send(s,200,{status:st})};
 R['GET /api/me/applications']=(q,s,u)=>send(s,200,db.apps.filter(a=>a.userId===u.id).map(a=>{const j=db.jobs.find(x=>x.id===a.jobId);return{id:a.id,status:a.status||'new',createdAt:a.createdAt,job:j?{id:j.id,title:j.title,company:j.company}:null}}).reverse());
}
