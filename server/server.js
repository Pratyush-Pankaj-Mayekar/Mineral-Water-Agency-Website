import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDatabase } from './config/db.js';
import { initializeStore, databaseMode } from './services/store.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import commerceRoutes from './routes/commerce.js';
import contentRoutes from './routes/content.js';
import adminRoutes from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((item) => item.trim()).filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/\d+-[a-z0-9-]+\.e2b\.app$/i.test(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use((req, _res, next) => { if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) req.body = {}; next(); });
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Pure Aqua API', mode: databaseMode(), timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api', commerceRoutes);
app.use('/api', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(resolve(__dirname, '../client/public/uploads'), { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));

const clientDist = resolve(__dirname, '../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));
  app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(resolve(clientDist, 'index.html')));
}
app.use(notFound);
app.use(errorHandler);

try {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('replace-with'))) {
    throw new Error('Set a strong JWT_SECRET (at least 32 characters) before starting in production.');
  }
  await initializeStore();
  const db = await checkDatabase();
  if (db.mode === 'demo') console.info('[Pure Aqua] Running the seeded demo store. Configure DB_MODE=mysql to use MySQL.');
  else console.info('[Pure Aqua] Connected to MySQL.');
  app.listen(port, '0.0.0.0', () => console.info(`[Pure Aqua] API listening on 0.0.0.0:${port}`));
} catch (error) {
  console.error('[Pure Aqua] Startup failed:', error.message);
  process.exit(1);
}

export default app;
