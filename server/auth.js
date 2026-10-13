// Signup (with password confirmation), password recovery, phone OTP, invitation links.
import crypto from 'crypto';

export default function(R,c){
  const {db,flush,send,json,session,hash,mk,sendMail,sendSms,check}=c;
  const prod = process.env.NODE_ENV === 'production';

  db.resets ??= {};
  db.otps ??= {};
  db.invites ??= {};
  db.emailVerifications ??= {};

  const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
  const origin = q => process.env.APP_URL || `${q.headers['x-forwarded-proto'] || 'http'}://${q.headers.host}`;
  const open = (k,f) => { f.open = true; R[k] = f; };

  const breached = async password => {
    const pw = String(password || '');
    if (!pw || (!prod && process.env.HIBP_BREACHED_CHECK !== '1')) return false;
    const h = crypto.createHash('sha1').update(pw, 'utf8').digest('hex').toUpperCase();
    const prefix = h.slice(0, 5), suffix = h.slice(5);
    try {
      const r = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {'User-Agent': 'rblink.chat password safety check', 'Add-Padding': 'true'},
        signal: AbortSignal.timeout(3000)
      });
      if (!r.ok) return false;
      const lines = await r.text();
      return lines.split(/\r?\n/).some(line => line.split(':')[0] === suffix);
    } catch {
      return false;
    }
  };

  const pwCheck = async b => {
    const password = String(b.password || '');
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== String(b.confirmPassword || '')) return 'Passwords do not match';
    if (await breached(password)) return 'That password has appeared in a data breach. Choose a different one.';
    return '';
  };

  const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const genSecret = () => Array.from({length: 32}, () => base32Alphabet[Math.floor(Math.random() * base32Alphabet.length)]).join('');
  const base32Decode = value => {
    let bits = '';
    const out = [];
    const cleaned = String(value || '').replace(/=+$/, '').toUpperCase();
    for (const ch of cleaned) {
      const idx = base32Alphabet.indexOf(ch);
      if (idx === -1) continue;
      bits += idx.toString(2).padStart(5, '0');
    }
    while (bits.length >= 8) {
      out.push(parseInt(bits.slice(0, 8), 2));
      bits = bits.slice(8);
    }
    return Buffer.from(out);
  };
  const verifyTotp = (code, secret) => {
    const digits = String(code || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(digits)) return false;
    const counter = Math.floor(Date.now() / 30000);
    const key = base32Decode(secret || '');
    for (let offset = -1; offset <= 1; offset += 1) {
      const value = BigInt(counter + offset);
      const msg = Buffer.alloc(8);
      msg.writeBigUInt64BE(value, 0);
      const h = crypto.createHmac('sha1', key).update(msg).digest();
      const offsetByte = h[h.length - 1] & 0x0f;
      const digest = ((h[offsetByte] & 0x7f) << 24) | ((h[offsetByte + 1] & 0xff) << 16) | ((h[offsetByte + 2] & 0xff) << 8) | (h[offsetByte + 3] & 0xff);
      const expected = String(digest % 1_000_000).padStart(6, '0');
      if (expected === digits) return true;
    }
    return false;
  };
  const hashCode = value => crypto.createHash('sha256').update(String(value)).digest('hex');
  const recoveryCode = () => `RC-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  db.pending2fa ??= {};


  const verification = async (q,u) => {
    const t = crypto.randomBytes(32).toString('hex');
    db.emailVerifications[sha(t)] = {uid: u.id, exp: Date.now() + 864e5};
    flush();
    const link = `${origin(q)}/#/verify-email?token=${t}`;
    const m = await sendMail({
      to: u.email,
      subject: 'Verify your rblink.chat email',
      text: `Hi ${u.name},\n\nVerify your email within 24 hours:\n${link}\n\nIf you did not create this account, ignore this email.`
    });
    return {
      message: 'Check your email to verify your account.',
      ...(m.sent ? {} : !prod ? {devLink: link} : {})
    };
  };

  const useInvite = (t,u) => {
    const i = db.invites[t];
    if (i && i.exp > Date.now() && i.uses < i.max) {
      i.uses += 1;
      u.invitedBy = i.by;
      u.inviteToken = t;
      flush();
    }
  };
  c.useInvite = useInvite;

  open('POST /api/auth/signup', async (q,s) => {
    const b = await json(q);
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return send(s,400,{error:'Enter your name and a valid email'});
    }
    const pe = await pwCheck(b);
    if (pe) return send(s,400,{error:pe});
    if (db.users.some(u => u.email === email)) return send(s,409,{error:'An account with this email already exists'});

    const u = mk(name, email, b.password, {emailVerified: false});
    if (b.invite) useInvite(b.invite, u);
    await verification(q, u);
    return session(q,s,u);
  });

  open('POST /api/auth/login', async (q,s) => {
    const {email,password,code} = await json(q);
    const user = db.users.find(x => x.email === String(email || '').trim().toLowerCase());
    if (!user || !user.pw || !check(String(password || ''), user.pw)) {
      return send(s,401,{error:'Incorrect email or password'});
    }
    if (user.twoFactorEnabled) {
      const recoveryToken = typeof code === 'string' ? code.trim().toUpperCase() : '';
      const hasTotp = typeof code === 'string' && verifyTotp(code, user.twoFactorSecret);
      const recovery = typeof code === 'string' && Array.isArray(user.twoFactorRecoveryCodes) && user.twoFactorRecoveryCodes.includes(hashCode(recoveryToken));
      if (!hasTotp && !recovery) return send(s,401,{error:'Two-factor authentication required'});
      if (recovery && Array.isArray(user.twoFactorRecoveryCodes)) {
        user.twoFactorRecoveryCodes = user.twoFactorRecoveryCodes.filter(item => item !== hashCode(recoveryToken));
        flush();
      }
    }
    return session(q,s,user);
  });

  R['POST /api/auth/2fa/setup'] = (q,s,u) => {
    if (u.twoFactorEnabled) return send(s,200,{enabled: true, otpAuthUrl: `otpauth://totp/rblink.chat:${encodeURIComponent(u.email || u.id)}?secret=${u.twoFactorSecret}&issuer=rblink.chat`});
    const secret = genSecret();
    const recoveryCodes = Array.from({length: 8}, () => recoveryCode());
    db.pending2fa[u.id] = {secret, recoveryCodes};
    flush();
    return send(s,200,{
      secret,
      otpAuthUrl: `otpauth://totp/rblink.chat:${encodeURIComponent(u.email || u.id)}?secret=${secret}&issuer=rblink.chat`,
      recoveryCodes,
      enabled: false
    });
  };

  R['POST /api/auth/2fa/enable'] = async (q,s,u) => {
    const {code, secret} = await json(q);
    const pending = db.pending2fa[u.id];
    const chosen = secret || pending?.secret;
    if (!pending || !chosen) return send(s,400,{error:'Start two-factor setup first'});
    if (!verifyTotp(code, chosen)) return send(s,400,{error:'Invalid authenticator code'});
    u.twoFactorEnabled = true;
    u.twoFactorSecret = chosen;
    u.twoFactorRecoveryCodes = pending.recoveryCodes.map(item => hashCode(item.toUpperCase()));
    delete db.pending2fa[u.id];
    flush();
    return send(s,200,{enabled: true, recoveryCodes: pending.recoveryCodes});
  };

  R['GET /api/me/security'] = (q,s,u) => send(s,200,{twoFactorEnabled: !!u.twoFactorEnabled, emailVerified: !!u.emailVerified});

  open('POST /api/auth/forgot', async (q,s) => {
    const e = String((await json(q)).email || '').trim().toLowerCase();
    const u = e && db.users.find(x => x.email === e);
    const out = {ok: true, message: 'If that email has an account, a reset link is on its way.'};
    if (u) {
      const t = crypto.randomBytes(32).toString('hex');
      db.resets[sha(t)] = {uid: u.id, exp: Date.now() + 36e5};
      flush();
      const link = `${origin(q)}/#/reset?token=${t}`;
      const m = await sendMail({
        to: u.email,
        subject: 'Reset your rblink.chat password',
        text: `Hi ${u.name},\n\nUse this link within 1 hour to choose a new password:\n${link}\n\nIf you did not ask for this, ignore this email.`
      });
      if (!m.sent && !prod) out.devLink = link;
    }
    return send(s,200,out);
  });

  open('POST /api/auth/reset', async (q,s) => {
    const b = await json(q);
    const token = sha(b.token);
    const r = db.resets[token];
    if (!r || r.exp < Date.now()) return send(s,400,{error:'This reset link is invalid or has expired'});

    const pe = await pwCheck(b);
    if (pe) return send(s,400,{error:pe});

    const u = db.users.find(x => x.id === r.uid);
    if (!u) return send(s,400,{error:'This reset link is invalid or has expired'});
    u.pw = hash(b.password);
    delete db.resets[token];
    flush();
    return session(q,s,u);
  });

  open('GET /api/auth/verify-email', async (q,s,u,P,x) => {
    const t = x.searchParams.get('token') || '';
    const r = db.emailVerifications[sha(t)];
    if (!r || r.exp < Date.now()) return send(s,400,{error:'This verification link is invalid or has expired'});

    const v = db.users.find(a => a.id === r.uid);
    if (!v) return send(s,400,{error:'Account not found'});
    v.emailVerified = true;
    delete db.emailVerifications[sha(t)];
    flush();
    return session(q,s,v);
  });

  open('POST /api/auth/resend-verification', async (q,s) => {
    const e = String((await json(q)).email || '').trim().toLowerCase();
    const u = db.users.find(a => a.email === e);
    if (!u || u.emailVerified) return send(s,200,{ok: true});
    return send(s,200,await verification(q,u));
  });

  const E164 = /^\+[1-9]\d{7,14}$/;

  open('POST /api/auth/phone/start', async (q,s) => {
    const {phone} = await json(q);
    if (!E164.test(phone || '')) return send(s,400,{error:'Use international format, e.g. +2348012345678'});

    const o = db.otps[phone];
    if (o && Date.now() - o.sent < 30e3) return send(s,429,{error:'Wait 30 seconds before asking for another code'});

    const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
    db.otps[phone] = {h: sha(code + phone), exp: Date.now() + 6e5, tries: 0, sent: Date.now()};
    flush();

    const message = await sendSms(phone, `Your rblink.chat code is ${code}. It expires in 10 minutes.`);
    const dev = process.env.DEV_OTP === '1' || !prod;
    if (!message.sent && !dev) return send(s,501,{error:'SMS sign-in is not configured on this server'});
    return send(s,200, message.sent ? {ok: true} : {ok: true, devCode: code});
  });

  open('POST /api/auth/phone/verify', async (q,s) => {
    const b = await json(q);
    const phone = String(b.phone || '');
    const o = db.otps[phone];
    if (!o || o.exp < Date.now() || o.tries >= 5) return send(s,400,{error:'Code expired. Ask for a new one'});

    if (sha(String(b.code || '').trim() + phone) !== o.h) {
      o.tries += 1;
      flush();
      return send(s,400,{error:'Wrong code'});
    }

    let u = db.users.find(x => x.phone === phone);
    if (!u) {
      if (!String(b.name || '').trim()) return send(s,400,{error:'Enter your name to create your account', needName: true});
      u = mk(String(b.name).trim(), '', '', {phone});
      if (b.invite) useInvite(b.invite, u);
    }

    delete db.otps[phone];
    flush();
    return session(q,s,u);
  });

  R['POST /api/invites'] = async (q,s,u) => {
    const t = crypto.randomBytes(9).toString('base64url');
    db.invites[t] = {by: u.id, exp: Date.now() + 7 * 864e5, uses: 0, max: 50};
    flush();
    return send(s,200,{token: t, link: `${origin(q)}/#/join/${t}`});
  };

  R['GET /api/invites/mine'] = (q,s,u) => send(s,200, Object.entries(db.invites)
    .filter(([,i]) => i.by === u.id)
    .map(([t,i]) => ({
      token: t,
      uses: i.uses,
      max: i.max,
      exp: i.exp,
      referred: db.users.filter(x => x.invitedBy === u.id && x.inviteToken === t).length,
      link: `${origin(q)}/#/join/${t}`
    })) );

  open('GET /api/invites/:token', (q,s,u,P) => {
    const i = db.invites[P.token];
    if (!i || i.exp < Date.now() || i.uses >= i.max) return send(s,404,{valid: false});
    return send(s,200,{valid: true, inviter: db.users.find(x => x.id === i.by)?.name || 'A member'});
  });
}
