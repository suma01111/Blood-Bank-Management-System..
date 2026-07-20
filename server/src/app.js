import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { config } from './config.js';
import { logger } from './logger.js';

export const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = config.clientUrl.split(',').map(origin => origin.trim()).filter(Boolean);
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const vercelOriginPattern = /^https:\/\/[\w-]+\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!config.isProduction && localOriginPattern.test(origin)) return true;
  if (config.isProduction && vercelOriginPattern.test(origin)) return true;
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    logger.warn('Blocked CORS request', { origin, allowedOrigins });
    return callback(null, false);
  },
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');
app.use(express.static(clientDist));
app.get('/{*path}', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(clientDist, 'index.html'), error => error && next()));
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, _next) => {
  logger.requestError(req, error, 'Unhandled server error');
  if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(item => item.message).join(' ') });
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (error.message?.includes('not allowed to access the Blood Bank API')) return res.status(403).json({ message: error.message });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
