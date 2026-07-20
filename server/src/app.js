import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { config } from './config.js';

export const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: config.clientUrl }));
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
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(item => item.message).join(' ') });
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
