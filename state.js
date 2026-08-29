import { kv } from '@vercel/kv';

const KEY = 'egipto-2026-trip';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = (await kv.get(KEY)) || {};
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    await kv.set(KEY, req.body);
    return res.status(200).json({ ok: true });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method not allowed');
}
