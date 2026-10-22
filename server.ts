import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/middleware/auth.ts';
import { apiRouter } from './server/routes/api.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // Simple logger
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    // Health check endpoint
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
    });

    // Mount API router with RBAC authentication middleware
    app.use('/api', authMiddleware, apiRouter);

    // Catch-all for unmatched /api routes
    app.use('/api/*', (req, res) => {
      console.warn(`Unmatched API route: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Class Management System server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('FAILED TO START SERVER:', error);
    process.exit(1);
  }
}

startServer();
