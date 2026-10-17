import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { generateReply } from './gemma.mjs';

export function createAIProxy(config, generate = generateReply) {
  let active = 0;
  let windowStart = Date.now();
  let requests = 0;
  const origins = new Set(config.origins ?? ['http://localhost:4173', 'http://127.0.0.1:4173', 'http://localhost:8081', 'http://127.0.0.1:8081']);
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    const origin = req.headers.origin;
    if (origin && !origins.has(origin)) return send(403, { error: 'Browser origin is not allowed.' });
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (config.token) {
      const supplied = Buffer.from(req.headers.authorization ?? '');
      const expected = Buffer.from(`Bearer ${config.token}`);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return send(401, { error: 'Set the server access token in CampusIQ settings.' });
    }
    if (req.url === '/health' && req.method === 'GET') return send(200, { status: 'ok', apiConfigured: Boolean(config.apiKey), priority: ['gemma-api', 'gemma-local'] });
    if (req.url !== '/api/chat' || req.method !== 'POST') return send(404, { error: 'Not found.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON required.' });
    if (active >= 1) return send(429, { error: 'Assistant is busy. Try again shortly.' });
    if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
    if (requests >= 10) return send(429, { error: 'Local request limit reached. Wait one minute.' });
    active++;
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4235264) { send(413, { error: 'Request is too large. Use one image up to 3 MB.' }); return; }
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString()); }
      catch { return send(400, { error: 'Invalid JSON.' }); }
      if (!body || typeof body.query !== 'string' || !body.query.trim() || body.query.length > 2000 ||
          !body.context || typeof body.context !== 'object' || Array.isArray(body.context) ||
          (body.allowCloud !== undefined && typeof body.allowCloud !== 'boolean') ||
          (body.allowLocal !== undefined && typeof body.allowLocal !== 'boolean')) return send(400, { error: 'A question (up to 2000 characters) and academic context are required.' });
      if (Buffer.byteLength(JSON.stringify(body.context)) > 32768) return send(413, { error: 'Academic context is too large.' });
      if (body.image !== undefined) {
        const image = body.image;
        if (!image || typeof image.data !== 'string' || image.data.length > 4194304 ||
            !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) ||
            image.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) return send(400, { error: 'Use one JPEG, PNG, or WebP image up to 3 MB.' });
        const bytes = Buffer.from(image.data, 'base64');
        const valid = (image.mimeType === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
          (image.mimeType === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
          (image.mimeType === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
        if (!valid || bytes.length > 3145728) return send(400, { error: 'Image content must match its JPEG, PNG, or WebP type and be at most 3 MB.' });
      }
      requests++;
      try { send(200, await generate(body, config)); }
      catch (error) { send(503, { error: error.message }); }
    } catch { if (!res.writableEnded) send(400, { error: 'Could not read request.' }); }
    finally { active--; }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile(new URL('./.env', import.meta.url)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const host = process.env.AI_HOST || '127.0.0.1';
  const token = process.env.AI_SERVER_TOKEN || '';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !token) throw new Error('AI_SERVER_TOKEN is required for LAN access.');
  const config = { apiKey: process.env.GEMINI_API_KEY?.trim() || '', token,
    ollamaUrl: 'http://127.0.0.1:11434',
    origins: process.env.AI_ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean),
  };
  createAIProxy(config).listen(Number(process.env.AI_PORT || 8787), host, () => {
    console.log(`CampusIQ Gemma server: http://${host}:${process.env.AI_PORT || 8787}`);
    console.log(`Gemma API key: ${config.apiKey ? 'configured' : 'not configured'}; fallback: local gemma4:e4b-it-qat. No paid providers.`);
  });
}
