import type { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function loadLocalEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', 'backend', '.env'),
  ];
  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        const key = (process.env.GEMINI_API_KEY || '').trim();
        if (key && !key.startsWith('your_')) {
          break;
        }
      }
    } catch {
      // Ignore
    }
  }
}

function hasConfiguredKey(): boolean {
  loadLocalEnv();
  const raw = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').trim();
  if (!raw) return false;
  const parsed = raw
    .split(/[,;\r\n]+/)
    .map((k) => k.trim())
    .filter((k) => k && !k.startsWith('your_') && k.length > 10);
  return parsed.length > 0;
}

function handleNodeRequest(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'healthy',
      configured: hasConfiguredKey(),
      version: '1.0.0',
    })
  );
}

function handleWebRequest(req: Request): Response {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  }

  return new Response(
    JSON.stringify({
      status: 'healthy',
      configured: hasConfiguredKey(),
      version: '1.0.0',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export default async function handler(req: any, res?: any) {
  if (res && typeof res.writeHead === 'function') {
    return handleNodeRequest(req, res);
  }
  return handleWebRequest(req);
}
