// Small fetch helpers shared by every platform screen.
export async function api(method: string, path: string, body?: any): Promise<any> {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let data: any = null;
  try { data = await r.json(); } catch { /* empty body */ }
  if (!r.ok) throw Object.assign(new Error((data && data.error) || 'Something went wrong. Please try again.'), { status: r.status, data });
  return data;
}

// Upload one or more files; returns [{url, name, type, size}]
export async function upload(files: File[]): Promise<any[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f, f.name));
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  let data: any = null;
  try { data = await r.json(); } catch { /* ignore */ }
  if (!r.ok) throw new Error((data && data.error) || 'Upload failed');
  return data.files;
}
