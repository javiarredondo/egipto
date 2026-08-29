import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const STATE_KEY = 'egipto_state';

export default async function handler(req, res) {
  // Configuración de cabeceras CORS para permitir peticiones desde la app
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const data = await redis.get(STATE_KEY);
      return res.status(200).json(data || null);
    } 
    
    if (req.method === 'POST') {
      const payload = req.body;
      await redis.set(STATE_KEY, payload);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis error:', error);
    return res.status(500).json({ error: error.message });
  }
}
