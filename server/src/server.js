import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config.js';
import { BloodInventory, bloodGroups } from './models.js';

try {
  await mongoose.connect(config.mongoUri);
  await Promise.all(bloodGroups.map(bloodGroup => BloodInventory.updateOne({ bloodGroup }, { $setOnInsert: { unitsAvailable: 0 } }, { upsert: true })));
  app.listen(config.port, () => console.log(`Blood Bank API running on http://localhost:${config.port}`));
} catch (error) {
  console.error(`Unable to connect to MongoDB at ${config.mongoUri}`);
  console.error('Start MongoDB, then run the application again.');
  console.error(error.message);
  process.exit(1);
}
