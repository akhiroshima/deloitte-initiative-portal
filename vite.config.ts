import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.LLM_PROVIDER': JSON.stringify(env.LLM_PROVIDER || 'groq'),
        // Flag to indicate dev proxy is available in browser runtime
        'window.__DEV_PROXY__': mode === 'development'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        // Add a minimal proxy middleware to call Groq server-side (avoids CORS and keeps key server-side)
        middlewareMode: false,
        configureServer(server) {
          server.middlewares.use('/api/groq/chat/completions', async (req, res) => {
            try {
              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const body = Buffer.concat(chunks).toString('utf8') || '{}';
              const apiKey = env.GROQ_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing GROQ_API_KEY on server' }));
                return;
              }
              const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
                body,
              });
              const text = await upstream.text();
              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(text);
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: (e as Error).message }));
            }
          });
        }
      }
    };
});
