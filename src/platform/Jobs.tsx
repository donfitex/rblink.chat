import React, { useEffect, useState } from 'react';
import { api, upload } from './api';
import { go, useMe } from './hooks';
import { Avatar, btn, btn2, card, field } from './ui';

const LEVELS: [string, string][] = [['entry', 'Entry level'], ['mid', 'Mid level'], ['senior', 'Senior'], ['lead', 'Lead / Manager'], ['executive', 'Executive']];
const TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const levelLabel = (v: string) => (LEVELS.find((l) => l[0] === v) || [v, v])[1];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Optional questions a recruiter can switch on, and the input type used for each
const FIELDS: [string, string, string][] = [
  ['phone', 'Phone number', 'tel'], ['yearsExperience', 'Years of experience', 'number'], ['currentEmployer', 'Current employer', 'text'],
  ['currentPosition', 'Current position', 'text'], ['cv', 'CV / Resume', 'file'], ['coverLetter', 'Cover letter', 'textarea'],
  ['linkedin', 'LinkedIn profile', 'url'], ['portfolio', 'Portfolio or website', 'url'], ['expectedSalary', 'Expected salary', 'text']
];
const DEFAULT_FIELDS: any = {
  phone: { on: true, req: false }, yearsExperience: { on: true, req: true }, currentEmployer: { on: true, req: false },
  currentPosition: { on: true, req: true }, cv: { on: true, req: true }, coverLetter: { on: true, req: false },
  linkedin: { on: false, req: false }, portfolio: { on: false, req: false }, expectedSalary: { on: false, req: false }
};

const LoginBlock = ({ text }: { text: string }) => {
  const { needLogin } = useMe();
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className={`${card} p-6`}><div className="text-4xl">🔒</div><p className="mt-2 text-white">{text}</p>
        <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button></div>
    </div>
  );
};

const JobCard = ({ j }: { j: any }) => (
  <button onClick={() => go('jobs/' + j.id)} className={`${card} flex w-full gap-3 p-4 text-left hover:border-[#1D9BD1]`}>
    {j.image
      ? <img src={j.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#222529] text-2xl">💼</div>}
    <div className="min-w-0 flex-1">
      <div className="truncate font-semibold text-white">{j.title}</div>
      <div className="truncate text-sm text-[#B9BBBE]">{j.company}</div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#8D9197]">
        {[j.remote ? 'Remote' : j.location, cap(j.type), levelLabel(j.level), j.salary, j.endDate && `Closes ${j.endDate}`].filter(Boolean).map((t: string) => <span key={t}>{t}</span>)}
      </div>
    </div>
  </button>
);

// ---------- Admin: approve or decline recruiter requests
const RecruiterRequests = () => {
  const [list, setList] = useState<any[]>([]);
  const load = () => api('GET', '/api/admin/recruiters').then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  if (!list.length) return null;
  const answer = async (r: any, approve: boolean) => { await api('POST', '/api/admin/recruiters/' + r.id, { approve }).catch((e) => alert(e.message)); load(); };
  return (
    <div className={`${card} border-[#1D9BD1] p-4`}>
      <h3 className="mb-2 font-semibold text-white">Recruiter requests ({list.length})</h3>
      {list.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-3 py-1.5">
          <Avatar user={r.user} size={32} />
          <div className="min-w-0 flex-1 text-sm text-white">{r.user.name} <span className="text-[#8D9197]">· {r.company || 'No company given'}</span>{r.note && <div className="text-xs text-[#8D9197]">{r.note}</div>}</div>
          <button className={btn} onClick={() => answer(r, true)}>Approve</button>
          <button className={btn2} onClick={() => answer(r, false)}>Decline</button>
        </div>
      ))}
    </div>
  );
};

// ---------- Browse jobs (everyone can look)
const JobList = () => {
  const { me, needLogin } = useMe();
  const [f, setF] = useState({ q: '', location: '', level: '', type: '' });
  const [jobs, setJobs] = useState<any[] | null>(null);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v as string); });
      api('GET', '/api/jobs?' + p.toString()).then(setJobs).catch(() => setJobs([]));
    }, 300);
    return () => clearTimeout(t);
  }, [f]);
  const isAdmin = me && (me.role === 'owner' || me.role === 'admin');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-white">Jobs</h1>
        {me && <button className={btn2} onClick={() => go('jobs/applied')}>My applications</button>}
        {me && <button className={btn2} onClick={() => go('jobs/mine')}>My job posts</button>}
        <button className={btn} onClick={() => (me ? go('jobs/new') : needLogin())}>+ Post a job</button>
      </div>
      {isAdmin && <RecruiterRequests />}
      <div className="grid gap-2 sm:grid-cols-4">
        <input className={`${field} sm:col-span-2`} placeholder="Search job title or company" value={f.q} onChange={set('q')} />
        <input className={field} placeholder="Location (or type remote)" value={f.location} onChange={set('location')} />
        <div className="flex gap-2">
          <select className={field} value={f.level} onChange={set('level')}><option value="">Any level</option>{LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select className={field} value={f.type} onChange={set('type')}><option value="">Any type</option>{TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select>
        </div>
      </div>
      {jobs === null && <p className="text-sm text-[#8D9197]">Loading jobs...</p>}
      {jobs && !jobs.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>No open jobs match your search.</div>}
      <div className="space-y-3">{(jobs || []).map((j) => <JobCard key={j.id} j={j} />)}</div>
    </div>
  );
};

// ---------- Apply form (built from what the recruiter chose)
const ApplyModal = ({ job, onClose, onDone }: { job: any; onClose: () => void; onDone: () => void }) => {
  const { me } = useMe();
  const F = job.form.fields;
  const [a, setA] = useState<any>({ email: me.email || '', fullName: me.name || '' });
  const [custom, setCustom] = useState<any>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvLink, setCvLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k: string) => (e: any) => setA({ ...a, [k]: e.target.value });
  const star = (k: string) => (F[k] && F[k].req ? ' *' : '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const answers = { ...a };
      if (F.cv && F.cv.on) {
        if (cvFile) answers.cv = (await upload([cvFile]))[0].url;
        else if (cvLink.trim()) answers.cv = cvLink.trim();
      }
      await api('POST', `/api/jobs/${job.id}/apply`, { answers, custom });
      setSent(true);
      onDone();
    } catch (er: any) { setErr(er.message); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3" onClick={onClose}>
      <div className={`${card} mx-auto my-6 w-full max-w-lg p-5`} onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <h3 className="mt-2 text-lg font-bold text-white">Application sent!</h3>
            <p className="text-sm text-[#8D9197]">The recruiter has been notified. Good luck!</p>
            <button className={`${btn} mt-4`} onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-start justify-between"><div><h3 className="text-lg font-bold text-white">Apply: {job.title}</h3><p className="text-xs text-[#8D9197]">{job.company} · fields marked * are required</p></div><button type="button" className="text-2xl text-[#8D9197]" onClick={onClose}>×</button></div>
            <label className="block text-xs text-[#8D9197]">Full name *<input className={`${field} mt-1`} value={a.fullName} onChange={set('fullName')} required /></label>
            <label className="block text-xs text-[#8D9197]">Email *<input className={`${field} mt-1`} type="email" value={a.email} onChange={set('email')} required /></label>
            {FIELDS.filter(([k]) => F[k] && F[k].on).map(([k, label, type]) => {
              if (k === 'cv') {
                return (
                  <div key={k} className="rounded-lg border border-[#383F45] p-3 text-xs text-[#8D9197]">
                    <div className="mb-2 text-sm text-white">CV / Resume{star(k)}</div>
                    <label className={`${btn2} inline-block cursor-pointer`}>📎 {cvFile ? cvFile.name : 'Upload from this device'}
                      <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setCvFile((e.target.files && e.target.files[0]) || null)} />
                    </label>
                    <div className="my-2">or paste a Google Drive, Dropbox or OneDrive link</div>
                    <input className={field} placeholder="https://drive.google.com/..." value={cvLink} onChange={(e) => setCvLink(e.target.value)} />
                  </div>
                );
              }
              return (
                <label key={k} className="block text-xs text-[#8D9197]">{label}{star(k)}
                  {type === 'textarea'
                    ? <textarea className={`${field} mt-1 min-h-[110px]`} value={a[k] || ''} onChange={set(k)} />
                    : <input className={`${field} mt-1`} type={type} min={type === 'number' ? 0 : undefined} value={a[k] || ''} onChange={set(k)} />}
                </label>
              );
            })}
            {job.form.custom.map((c: any) => (
              <label key={c.id} className="block text-xs text-[#8D9197]">{c.label}{c.req ? ' *' : ''}
                <input className={`${field} mt-1`} value={custom[c.id] || ''} onChange={(e) => setCustom({ ...custom, [c.id]: e.target.value })} />
              </label>
            ))}
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button className={`${btn} w-full py-2`} disabled={busy}>{busy ? 'Sending...' : 'Submit application'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

// ---------- Recruiter view of applications
const Applications = ({ job }: { job: any }) => {
  const [apps, setApps] = useState<any[] | null>(null);
  useEffect(() => { api('GET', `/api/jobs/${job.id}/applications`).then(setApps).catch(() => setApps([])); }, [job.id]);
  const setStatus = async (a: any, status: string) => {
    try { await api('PATCH', `/api/jobs/${job.id}/applications/${a.id}`, { status }); setApps((l) => (l || []).map((x) => (x.id === a.id ? { ...x, status } : x))); } catch (e: any) { alert(e.message); }
  };
  const csv = () => {
    const list = apps || [];
    const keys = Array.from(new Set(list.flatMap((a) => [...Object.keys(a.answers), ...Object.keys(a.custom)])));
    const q = (v: any) => '"' + String(v === undefined ? '' : v).replace(/"/g, '""') + '"';
    const lines = [['status', 'date', ...keys].map(q).join(',')].concat(list.map((a) => [a.status, a.createdAt, ...keys.map((k) => (a.answers[k] !== undefined ? a.answers[k] : a.custom[k]))].map(q).join(',')));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const el = document.createElement('a'); el.href = url; el.download = `applications-${job.title.replace(/\W+/g, '-')}.csv`; el.click(); URL.revokeObjectURL(url);
  };
  if (!apps) return <p className="text-sm text-[#8D9197]">Loading applications...</p>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-white">Applications ({apps.length})</h3>{apps.length > 0 && <button className={btn2} onClick={csv}>Download CSV</button>}</div>
      {!apps.length && <p className="text-sm text-[#8D9197]">No applications yet.</p>}
      {apps.map((a) => (
        <div key={a.id} className="rounded-lg border border-[#383F45] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Avatar user={a.applicant} size={30} /><span className="font-semibold text-white">{a.answers.fullName}</span>
            <a className="text-sm text-[#1D9BD1]" href={`mailto:${a.answers.email}`}>{a.answers.email}</a>
            <select className="ml-auto rounded-md border border-[#383F45] bg-[#222529] px-2 py-1 text-xs text-white" value={a.status || 'new'} onChange={(e) => setStatus(a, e.target.value)}>
              <option value="new">New</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option>
            </select>
          </div>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            {Object.entries(a.answers).filter(([k, v]) => v && !['fullName', 'email', 'cv'].includes(k)).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-[#8D9197]">{(FIELDS.find((x) => x[0] === k) || [k, k])[1]}</dt><dd className="whitespace-pre-wrap break-words text-[#D1D2D3]">{v as string}</dd></div>
            ))}
            {Object.entries(a.custom).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-[#8D9197]">{k}</dt><dd className="text-[#D1D2D3]">{v as string}</dd></div>
            ))}
          </dl>
          {a.answers.cv && <a className="mt-2 inline-block text-sm text-[#1D9BD1] underline" href={a.answers.cv} target="_blank" rel="noopener noreferrer">Open CV</a>}
        </div>
      ))}
    </div>
  );
};

// ---------- One job
const JobPage = ({ id }: { id: string }) => {
  const { me, needLogin } = useMe();
  const [j, setJ] = useState<any>(null);
  const [err, setErr] = useState('');
  const [apply, setApply] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const load = () => api('GET', '/api/jobs/' + id).then(setJ).catch((e) => setErr(e.message));
  useEffect(() => { setJ(null); load(); }, [id, me && me.id]);
  if (err) return <p className="p-6 text-center text-red-400">{err}</p>;
  if (!j) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;

  const own = me && (me.id === j.posterId || me.role === 'owner' || me.role === 'admin');
  const toggleClosed = async () => { try { await api('PATCH', '/api/jobs/' + id, { closed: !j.closed }); load(); } catch (e: any) { alert(e.message); } };
  const remove = async () => { if (confirm('Delete this job and all its applications?')) { try { await api('DELETE', '/api/jobs/' + id); go('jobs'); } catch (e: any) { alert(e.message); } } };
  const share = () => { const u = `${location.origin}/#/jobs/${id}`; navigator.clipboard.writeText(u).then(() => alert('Link copied'), () => prompt('Copy this link', u)); };

  let action: React.ReactNode = null;
  if (j.expired) action = <p className="rounded-md bg-[#222529] p-3 text-sm text-[#8D9197]">This job is closed and no longer accepts applications.</p>;
  else if (j.applyMode === 'form') action = j.applied
    ? <p className="rounded-md bg-green-900/40 p-3 text-sm text-green-300">✓ You have applied for this job.</p>
    : <button className={`${btn} px-5 py-2`} onClick={() => (me ? setApply(true) : needLogin())}>Apply now</button>;
  else if (j.applyMode === 'external' && j.formUrl) action = <a className={`${btn} inline-block px-5 py-2`} href={j.formUrl} target="_blank" rel="noopener noreferrer">Apply on the recruiter's form ↗</a>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <button className={btn2} onClick={() => go('jobs')}>← All jobs</button>
      <div className={`${card} overflow-hidden`}>
        {j.image && <img src={j.image} alt="" className="max-h-64 w-full object-cover" />}
        <div className="space-y-3 p-5">
          <div>
            <h1 className="text-xl font-bold text-white">{j.title}</h1>
            <p className="text-[#B9BBBE]">{j.company}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {[j.remote ? 'Remote' : j.location, cap(j.type), levelLabel(j.level), j.salary && `💰 ${j.salary}`, j.endDate && `Closes ${j.endDate}`].filter(Boolean).map((t: string) => <span key={t} className="rounded-full bg-[#222529] px-2.5 py-1 text-[#D1D2D3]">{t}</span>)}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-[#D1D2D3]">{j.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {j.website && <a className="text-[#1D9BD1] underline" href={j.website} target="_blank" rel="noopener noreferrer nofollow">Company website ↗</a>}
            {j.cvEmail && <a className="text-[#1D9BD1] underline" href={`mailto:${j.cvEmail}?subject=${encodeURIComponent('Application: ' + j.title)}`}>✉ Email your CV to {j.cvEmail}</a>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{action}<button className={btn2} onClick={share}>↗ Share</button></div>
          <div className="flex items-center gap-2 border-t border-[#383F45] pt-3 text-xs text-[#8D9197]"><Avatar user={j.poster} size={24} />Posted by {j.poster.name} · {j.applicants} applicant{j.applicants === 1 ? '' : 's'}</div>
        </div>
      </div>
      {own && (
        <div className={`${card} space-y-3 p-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold text-white">Recruiter tools</h3>
            <button className={btn2} onClick={() => setShowApps(!showApps)}>{showApps ? 'Hide' : 'View'} applications ({j.applicants})</button>
            <button className={btn2} onClick={toggleClosed}>{j.closed ? 'Reopen job' : 'Close job'}</button>
            <button className={`${btn2} text-red-400`} onClick={remove}>Delete</button>
          </div>
          {j.applyEmail && <p className="text-xs text-[#8D9197]">New applications are emailed to {j.applyEmail}.</p>}
          {showApps && <Applications job={j} />}
        </div>
      )}
      {apply && <ApplyModal job={j} onClose={() => setApply(false)} onDone={load} />}
    </div>
  );
};

// ---------- Post a job (approved recruiters only)
const JobForm = () => {
  const { me } = useMe();
  const [st, setSt] = useState('');
  const [rq, setRq] = useState({ company: '', note: '' });
  const [f, setF] = useState<any>({ title: '', company: '', location: '', remote: false, type: 'full-time', level: 'mid', salary: '', endDate: '', description: '', website: '', cvEmail: '', applyEmail: (me && me.email) || '', applyMode: 'form', formUrl: '' });
  const [fields, setFields] = useState<any>(DEFAULT_FIELDS);
  const [custom, setCustom] = useState<{ label: string; req: boolean }[]>([]);
  const [img, setImg] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (me) api('GET', '/api/recruiter/status').then((r) => setSt(r.status)).catch(() => setSt('none')); }, [me && me.id]);
  if (!me) return <LoginBlock text="Log in to post a job." />;
  if (!st) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;

  if (st !== 'approved') {
    const ask = async () => { try { setSt((await api('POST', '/api/recruiter/request', rq)).status); } catch (e: any) { setErr(e.message); } };
    return (
      <div className="mx-auto w-full max-w-md space-y-3 p-4">
        <button className={btn2} onClick={() => go('jobs')}>← Back</button>
        <div className={`${card} space-y-3 p-5`}>
          <h1 className="text-lg font-bold text-white">Become a verified recruiter</h1>
          {st === 'pending' ? <p className="text-sm text-green-300">Your request is waiting for approval. You will be able to post jobs as soon as an admin approves it.</p> : (
            <>
              <p className="text-sm text-[#8D9197]">To keep the job board trustworthy, only approved recruiters can post jobs. Tell us who you hire for.</p>
              <input className={field} placeholder="Company or organisation" value={rq.company} onChange={(e) => setRq({ ...rq, company: e.target.value })} />
              <textarea className={field} placeholder="Short note (website, LinkedIn, why you are hiring)" value={rq.note} onChange={(e) => setRq({ ...rq, note: e.target.value })} />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button className={`${btn} w-full py-2`} onClick={ask}>Request approval</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const flip = (k: string, prop: 'on' | 'req') => {
    const cur = fields[k];
    const next = { ...cur, [prop]: !cur[prop] };
    if (prop === 'on' && !next.on) next.req = false;
    if (prop === 'req' && next.req) next.on = true;
    setFields({ ...fields, [k]: next });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const image = img ? (await upload([img]))[0].url : '';
      const body = { ...f, image, form: { fields, custom: custom.filter((c) => c.label.trim()) } };
      const j = await api('POST', '/api/jobs', body);
      go('jobs/' + j.id);
    } catch (er: any) { setErr(er.message); }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4">
      <button type="button" className={btn2} onClick={() => go('jobs')}>← Back</button>
      <div className={`${card} space-y-3 p-5`}>
        <h1 className="text-xl font-bold text-white">Post a job</h1>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={field} placeholder="Job title *" value={f.title} onChange={set('title')} required />
          <input className={field} placeholder="Company *" value={f.company} onChange={set('company')} required />
          <input className={field} placeholder="Location, e.g. Lagos, Nigeria" value={f.location} onChange={set('location')} />
          <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} /> Remote work possible</label>
          <select className={field} value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select>
          <select className={field} value={f.level} onChange={set('level')}>{LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input className={field} placeholder="Salary range, e.g. $2,000 to $3,000 / month" value={f.salary} onChange={set('salary')} />
          <label className="text-xs text-[#8D9197]">Application closes<input className={`${field} mt-1`} type="date" min={new Date().toISOString().slice(0, 10)} value={f.endDate} onChange={set('endDate')} /></label>
        </div>
        <textarea className={`${field} min-h-[150px]`} placeholder="Describe the role, responsibilities and requirements *" value={f.description} onChange={set('description')} required />
        <div>
          <label className={`${btn2} inline-block cursor-pointer`}>🖼 {img ? img.name : 'Add a banner image (optional)'}<input type="file" accept="image/*" className="hidden" onChange={(e) => setImg((e.target.files && e.target.files[0]) || null)} /></label>
          {img && <button type="button" className="ml-2 text-xs text-[#8D9197] underline" onClick={() => setImg(null)}>remove</button>}
        </div>
        <input className={field} placeholder="Company website (optional)" value={f.website} onChange={set('website')} />
        <input className={field} type="email" placeholder="Public email where candidates can send CVs (optional)" value={f.cvEmail} onChange={set('cvEmail')} />
      </div>

      <div className={`${card} space-y-3 p-5`}>
        <h2 className="font-bold text-white">How should people apply?</h2>
        {([['form', 'Application form on rblink.chat', 'Applicants fill a form you design. Each application is emailed to you.'], ['external', 'My own form or website', 'Paste a Google Form or other link; the Apply button opens it.'], ['none', 'No apply button', 'Show only the details and the CV email above.']] as [string, string, string][]).map(([k, t, d]) => (
          <label key={k} className="flex cursor-pointer items-start gap-2 text-sm text-white"><input type="radio" className="mt-1" checked={f.applyMode === k} onChange={() => setF({ ...f, applyMode: k })} /><span>{t}<span className="block text-xs text-[#8D9197]">{d}</span></span></label>
        ))}
        {f.applyMode === 'external' && <input className={field} placeholder="https://forms.gle/..." value={f.formUrl} onChange={set('formUrl')} required />}
        {f.applyMode === 'form' && (
          <>
            <input className={field} type="email" placeholder="Email that receives applications (private)" value={f.applyEmail} onChange={set('applyEmail')} />
            <div className="rounded-lg border border-[#383F45]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-[#383F45] px-3 py-2 text-xs text-[#8D9197]"><span>Question</span><span>Ask</span><span>Required</span></div>
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3 py-1.5 text-sm text-[#D1D2D3]"><span>Full name</span><input type="checkbox" checked disabled /><input type="checkbox" checked disabled /></div>
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3 py-1.5 text-sm text-[#D1D2D3]"><span>Email</span><input type="checkbox" checked disabled /><input type="checkbox" checked disabled /></div>
              {FIELDS.map(([k, label]) => (
                <div key={k} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3 py-1.5 text-sm text-[#D1D2D3]">
                  <span>{label}</span>
                  <input type="checkbox" checked={fields[k].on} onChange={() => flip(k, 'on')} />
                  <input type="checkbox" checked={fields[k].req} onChange={() => flip(k, 'req')} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {custom.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={field} placeholder="Your own question" value={c.label} onChange={(e) => setCustom(custom.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-[#8D9197]"><input type="checkbox" checked={c.req} onChange={() => setCustom(custom.map((x, j) => (j === i ? { ...x, req: !x.req } : x)))} />Required</label>
                  <button type="button" className="text-[#8D9197]" onClick={() => setCustom(custom.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {custom.length < 10 && <button type="button" className={btn2} onClick={() => setCustom([...custom, { label: '', req: false }])}>+ Add your own question</button>}
            </div>
          </>
        )}
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button className={`${btn} w-full py-2.5`} disabled={busy}>{busy ? 'Publishing...' : 'Publish job'}</button>
    </form>
  );
};

// ---------- My job posts
const MyJobs = () => {
  const { me } = useMe();
  const [jobs, setJobs] = useState<any[] | null>(null);
  const load = () => api('GET', '/api/jobs?mine=1').then(setJobs).catch(() => setJobs([]));
  useEffect(() => { if (me) load(); }, [me && me.id]);
  if (!me) return <LoginBlock text="Log in to see your job posts." />;
  const toggle = async (j: any) => { await api('PATCH', '/api/jobs/' + j.id, { closed: !j.closed }).catch((e) => alert(e.message)); load(); };
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <div className="flex items-center gap-2"><button className={btn2} onClick={() => go('jobs')}>← Jobs</button><h1 className="mr-auto text-lg font-bold text-white">My job posts</h1><button className={btn} onClick={() => go('jobs/new')}>+ Post a job</button></div>
      {jobs && !jobs.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>You have not posted any jobs yet.</div>}
      {(jobs || []).map((j) => (
        <div key={j.id} className={`${card} flex flex-wrap items-center gap-3 p-4`}>
          <div className="min-w-0 flex-1"><div className="truncate font-semibold text-white">{j.title}</div><div className="text-xs text-[#8D9197]">{j.expired ? 'Closed' : 'Open'} · {j.applicants} applicant{j.applicants === 1 ? '' : 's'}</div></div>
          <button className={btn2} onClick={() => go('jobs/' + j.id)}>Applications</button>
          <button className={btn2} onClick={() => toggle(j)}>{j.closed ? 'Reopen' : 'Close'}</button>
        </div>
      ))}
    </div>
  );
};

// ---------- Jobs I applied for
const MyApplications = () => {
  const { me } = useMe();
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { if (me) api('GET', '/api/me/applications').then(setList).catch(() => setList([])); }, [me && me.id]);
  if (!me) return <LoginBlock text="Log in to see your applications." />;
  const color: any = { new: 'text-[#B9BBBE]', shortlisted: 'text-green-400', rejected: 'text-red-400' };
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <div className="flex items-center gap-2"><button className={btn2} onClick={() => go('jobs')}>← Jobs</button><h1 className="text-lg font-bold text-white">My applications</h1></div>
      {list && !list.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>You have not applied for any jobs yet.</div>}
      {(list || []).map((a) => (
        <button key={a.id} disabled={!a.job} onClick={() => a.job && go('jobs/' + a.job.id)} className={`${card} flex w-full items-center gap-3 p-4 text-left`}>
          <div className="min-w-0 flex-1"><div className="truncate font-semibold text-white">{a.job ? a.job.title : 'Job removed'}</div><div className="text-xs text-[#8D9197]">{a.job && a.job.company} · applied {new Date(a.createdAt).toLocaleDateString()}</div></div>
          <span className={`text-sm font-semibold capitalize ${color[a.status] || ''}`}>{a.status}</span>
        </button>
      ))}
    </div>
  );
};

// ---------- Picks the screen from the address: #/jobs, #/jobs/new, #/jobs/mine, #/jobs/applied, #/jobs/ID
export const JobsRouter = ({ arg }: { arg: string }) => {
  if (arg === 'new') return <JobForm />;
  if (arg === 'mine') return <MyJobs />;
  if (arg === 'applied') return <MyApplications />;
  if (arg) return <JobPage id={arg} />;
  return <JobList />;
};
