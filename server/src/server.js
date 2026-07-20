import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config.js';
import { BloodInventory, bloodGroups } from './models.js';
import { logger } from './logger.js';

try {
  await mongoose.connect(config.mongoUri);
  await Promise.all(bloodGroups.map(bloodGroup => BloodInventory.updateOne({ bloodGroup }, { $setOnInsert: { unitsAvailable: 0 } }, { upsert: true })));
  app.listen(config.port, () => logger.info('Blood Bank API running', { url: `http://localhost:${config.port}`, mongoUri: config.mongoUri }));
} catch (error) {
  logger.error('Unable to connect to MongoDB', { mongoUri: config.mongoUri, message: error.message, stack: error.stack });
  process.exit(1);
}
