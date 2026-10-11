// Saves a copy of the whole database to backups/db-DATE.json.  Run:  npm run backup
// Uses Supabase when it is configured in .env, otherwise copies data/db.json.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { remote, loadRemote } from '../server/store.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'backups');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, `db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
if (remote) {
  const data = await loadRemote();
  if (!data) { console.error('The Supabase database is empty. Nothing to back up.'); process.exit(1); }
  fs.writeFileSync(file, JSON.stringify(data));
} else {
  const local = path.join(path.resolve(process.env.DATA_DIR || path.join(root, 'data')), 'db.json');
  if (!fs.existsSync(local)) { console.error('No database found at ' + local); process.exit(1); }
  fs.copyFileSync(local, file);
}
console.log('Backup saved:', file, '(keep it private: it contains password hashes)');
