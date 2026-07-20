import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

export const config = {
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blood_bank',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@bloodbank.com',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123'
};
