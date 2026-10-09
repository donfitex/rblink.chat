import React from 'react';

export const btn = 'rounded-md bg-[#1D9BD1] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50';
export const btn2 = 'rounded-md border border-[#383F45] px-3 py-1.5 text-sm text-white hover:bg-[#2D3136] disabled:opacity-50';
export const field = 'w-full rounded-md bg-[#222529] border border-[#383F45] px-3 py-2 text-sm text-white outline-none focus:border-[#1D9BD1]';
export const card = 'rounded-xl border border-[#383F45] bg-[#19171D]';

export const Avatar = ({ user, size = 40 }: { user: any; size?: number }) => {
  const name: string = (user && user.name) || '?';
  if (user && user.avatar) {
    return <img src={user.avatar} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full bg-[#222529] object-cover" />;
  }
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 45% 38%)` }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    >
      {name[0].toUpperCase()}
    </div>
  );
};

export const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(iso).toLocaleDateString();
};

export const SOCIALS: [string, string, string][] = [
  ['github', 'GitHub', 'username or link'],
  ['portfolio', 'Portfolio', 'https://yoursite.com'],
  ['linkedin', 'LinkedIn', 'username or link'],
  ['instagram', 'Instagram', '@handle'],
  ['facebook', 'Facebook', 'username or link'],
  ['x', 'X (Twitter)', '@handle'],
  ['telegram', 'Telegram', '@handle'],
  ['youtube', 'YouTube', '@channel'],
  ['tiktok', 'TikTok', '@handle'],
  ['whatsapp', 'WhatsApp (private)', '+2348012345678']
];

export const socialUrl = (k: string, v: string) => {
  if (/^https?:\/\//i.test(v)) return v;
  const h = v.replace(/^@/, '');
  const m: any = {
    github: 'https://github.com/', instagram: 'https://instagram.com/', facebook: 'https://facebook.com/',
    x: 'https://x.com/', telegram: 'https://t.me/', linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/@', tiktok: 'https://tiktok.com/@'
  };
  return m[k] ? m[k] + h : 'https://' + v;
};
