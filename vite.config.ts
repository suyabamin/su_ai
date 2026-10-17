import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/chat' || url === '/api/chat/stream') {
          try {
            const { default: chatHandler } = await server.ssrLoadModule('/api/chat.ts');
            await chatHandler(req, res);
          } catch (err: any) {
            console.error('[API Dev Server] /api/chat error:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
            }
          }
        } else if (url === '/api/health') {
          try {
            const { default: healthHandler } = await server.ssrLoadModule('/api/health.ts');
            await healthHandler(req, res);
          } catch (err: any) {
            console.error('[API Dev Server] /api/health error:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
            }
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
