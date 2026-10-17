import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to create mock Node HTTP request & response
function createMockRequestResponse({ method = 'POST', url = '/api/chat', body = null } = {}) {
  const reqListeners = {};
  const req = {
    method,
    url,
    headers: { 'content-type': 'application/json' },
    body,
    on(event, handler) {
      reqListeners[event] = handler;
      return req;
    },
    emit(event, ...args) {
      if (reqListeners[event]) reqListeners[event](...args);
    },
    [Symbol.asyncIterator]: async function* () {
      if (body) {
        yield Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      }
    },
  };

  const headers = {};
  const chunks = [];
  let ended = false;

  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader(name, val) {
      headers[name.toLowerCase()] = val;
    },
    writeHead(code, customHeaders = {}) {
      this.statusCode = code;
      this.headersSent = true;
      for (const [k, v] of Object.entries(customHeaders)) {
        headers[k.toLowerCase()] = v;
      }
    },
    write(chunk) {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf-8'));
      return true;
    },
    end(finalChunk) {
      if (finalChunk) {
        chunks.push(typeof finalChunk === 'string' ? finalChunk : finalChunk.toString('utf-8'));
      }
      ended = true;
      this.headersSent = true;
      if (this.onEnd) this.onEnd();
    },
    getStatus: () => res.statusCode,
    getHeaders: () => headers,
    getBody: () => chunks.join(''),
    isEnded: () => ended,
  };

  return { req, res };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SuAI Serverless Health API (/api/health)', async () => {
  const { default: healthHandler } = await import('../api/health.ts');

  it('should respond to GET with healthy status and safe metadata', async () => {
    const { req, res } = createMockRequestResponse({ method: 'GET', url: '/api/health' });
    await healthHandler(req, res);

    assert.strictEqual(res.getStatus(), 200);
    const data = JSON.parse(res.getBody());
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(typeof data.configured, 'boolean');
    assert.strictEqual(data.version, '1.0.0');

    // Never leak model name or API keys in health check
    assert.strictEqual(data.model, undefined, 'Health check must not expose model name');
    assert.strictEqual(data.apiKey, undefined, 'Health check must not expose API key');
    assert.strictEqual(data.key, undefined, 'Health check must not expose key');
  });

  it('should handle OPTIONS preflight with CORS headers', async () => {
    const { req, res } = createMockRequestResponse({ method: 'OPTIONS', url: '/api/health' });
    await healthHandler(req, res);

    assert.strictEqual(res.getStatus(), 204);
    assert.strictEqual(res.getHeaders()['access-control-allow-origin'], '*');
  });
});

describe('SuAI Serverless Chat API Validation (/api/chat)', async () => {
  const { default: chatHandler } = await import('../api/chat.ts');

  it('should reject non-POST requests with 405 Method Not Allowed', async () => {
    const { req, res } = createMockRequestResponse({ method: 'GET', url: '/api/chat' });
    await chatHandler(req, res);

    assert.strictEqual(res.getStatus(), 405);
    const body = JSON.parse(res.getBody());
    assert.match(body.error, /Method not allowed/i);
  });

  it('should reject empty messages with 400 Bad Request', async () => {
    const { req, res } = createMockRequestResponse({
      method: 'POST',
      url: '/api/chat',
      body: { message: '   ' },
    });
    await chatHandler(req, res);

    assert.strictEqual(res.getStatus(), 400);
    const body = JSON.parse(res.getBody());
    assert.match(body.error, /cannot be empty/i);
  });

  it('should reject oversized messages with 400 Bad Request', async () => {
    const oversized = 'a'.repeat(8001);
    const { req, res } = createMockRequestResponse({
      method: 'POST',
      url: '/api/chat',
      body: { message: oversized },
    });
    await chatHandler(req, res);

    assert.strictEqual(res.getStatus(), 400);
    const body = JSON.parse(res.getBody());
    assert.match(body.error, /exceeds maximum allowed length/i);
  });
});

describe('SuAI Streaming & Identity E2E Verification (/api/chat)', async () => {
  const { default: chatHandler } = await import('../api/chat.ts');

  async function callChatWithRetry(body, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { req, res } = createMockRequestResponse({
        method: 'POST',
        url: '/api/chat',
        body,
      });
      await chatHandler(req, res);
      const resBody = res.getBody();
      if (resBody.includes('quota exceeded') && attempt < maxRetries) {
        // Wait before retrying quota-limited call
        await sleep(4000);
        continue;
      }
      return { res, body: resBody };
    }
  }

  function extractText(body) {
    const lines = body.split('\n');
    let fullText = '';
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) fullText += parsed.chunk;
          } catch {}
        }
      }
    }
    return fullText;
  }

  it('should stream chunks and end with done: true for standard query', async () => {
    await sleep(2500);
    const { res, body } = await callChatWithRetry({
      message: 'Say "SuAI verified" in two words.',
      history: [],
    });

    assert.strictEqual(res.getStatus(), 200);
    assert.match(res.getHeaders()['content-type'], /text\/event-stream/);
    assert.ok(body.includes('data: {"chunk":'), 'Response must contain SSE data chunks');
    assert.ok(body.includes('"done":true') || body.includes('"done": true'), 'Response must conclude with done signal');
  });

  it('should identify naturally as SuAI when asked "Who are you?"', async () => {
    await sleep(2500);
    const { res, body } = await callChatWithRetry({
      message: 'Who are you?',
      history: [],
    });

    assert.strictEqual(res.getStatus(), 200);
    const fullText = extractText(body);
    assert.match(fullText, /SuAI/i, 'Response should identify naturally as SuAI');
  });

  it('should truthfully acknowledge Google Gemini when directly asked about provider', async () => {
    await sleep(2500);
    const { res, body } = await callChatWithRetry({
      message: 'Is this using Gemini API or what AI model is powering you?',
      history: [],
    });

    assert.strictEqual(res.getStatus(), 200);
    const fullText = extractText(body);
    assert.match(fullText, /Gemini/i, 'Direct question should truthfully mention Gemini API');

    const envKey = process.env.GEMINI_API_KEY || '';
    if (envKey && envKey.length > 10) {
      assert.strictEqual(fullText.includes(envKey), false, 'API Key must NEVER appear in output');
    }
  });

  it('should respond fluently in Bengali when asked in Bengali', async () => {
    await sleep(2500);
    const { res, body } = await callChatWithRetry({
      message: 'তুমি কে? সংক্ষেপে বলো।',
      history: [],
    });

    assert.strictEqual(res.getStatus(), 200);
    const fullText = extractText(body);
    assert.match(fullText, /[\u0980-\u09FF]/, 'Response to Bengali prompt should contain Bengali characters');
    assert.match(fullText, /SuAI|সুআই/i, 'Response should maintain SuAI brand (Latin or Bengali script)');
  });
});

describe('Production Bundle Security Verification', () => {
  it('dist bundle must not contain GEMINI_API_KEY or private secrets', () => {
    const distAssetsDir = path.join(ROOT_DIR, 'dist', 'assets');
    if (!fs.existsSync(distAssetsDir)) {
      return; // Skip if not built yet
    }

    const files = fs.readdirSync(distAssetsDir);
    const envKey = process.env.GEMINI_API_KEY || '';

    for (const file of files) {
      const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf-8');
      if (envKey && envKey.length > 10) {
        assert.strictEqual(
          content.includes(envKey),
          false,
          `Critical Security Error: ${file} contains GEMINI_API_KEY!`
        );
      }
      assert.strictEqual(
        content.includes('VITE_GEMINI_API_KEY'),
        false,
        `Frontend bundle should not reference VITE_GEMINI_API_KEY`
      );
    }
  });
});
