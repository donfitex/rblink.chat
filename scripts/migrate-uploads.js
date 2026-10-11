// Copies the files in data/uploads to your Supabase storage bucket. Run once after switching to Supabase:  npm run migrate:uploads
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { remote, putFile, MIME } from '../server/store.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(path.resolve(process.env.DATA_DIR || path.join(root, 'data')), 'uploads');
if (!remote) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file first.'); process.exit(1); }
const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
let n = 0;
for (const f of files) {
  await putFile(f, fs.readFileSync(path.join(dir, f)), MIME[path.extname(f).toLowerCase()] || 'application/octet-stream');
  n++;
  console.log('uploaded', f);
}
console.log(`Done: ${n} file(s) copied to Supabase.`);
