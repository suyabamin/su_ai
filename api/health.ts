import type { IncomingMessage, ServerResponse } from 'http';
import { keyPool } from './keyPool.ts';

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
      configured: keyPool.hasAnyKey(),
      poolSize: keyPool.getPoolSize(),
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
      configured: keyPool.hasAnyKey(),
      poolSize: keyPool.getPoolSize(),
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
