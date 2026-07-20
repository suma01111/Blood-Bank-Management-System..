import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { config } from '../src/config.js';
import { BloodInventory, bloodGroups } from '../src/models.js';
import { logger } from '../src/logger.js';

let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  connectionPromise ||= mongoose.connect(config.mongoUri).then(async () => {
    await Promise.all(bloodGroups.map(bloodGroup =>
      BloodInventory.updateOne({ bloodGroup }, { $setOnInsert: { unitsAvailable: 0 } }, { upsert: true })
    ));
  }).catch(error => {
    connectionPromise = undefined;
    throw error;
  });
  await connectionPromise;
}

export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    logger.error('Database connection failed', { message: error.message, stack: error.stack });
    return res.status(503).json({ message: 'The database is temporarily unavailable.' });
  }
}
