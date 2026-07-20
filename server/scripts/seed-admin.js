import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { User } from '../src/models.js';

try {
  await mongoose.connect(config.mongoUri);
  const password = await bcrypt.hash(config.adminPassword, 12);
  const existing = await User.findOne({
    $or: [{ username: config.adminUsername }, { email: config.adminEmail }]
  }).select('+password');

  if (existing) {
    existing.username = config.adminUsername;
    existing.email = config.adminEmail;
    existing.password = password;
    existing.userType = 'admin';
    existing.phoneNumber ||= '0000000000';
    existing.address ||= 'Blood Bank Administration';
    await existing.save();
    console.log(`Administrator account updated: ${config.adminUsername}`);
  } else {
    await User.create({
      username: config.adminUsername,
      email: config.adminEmail,
      password,
      userType: 'admin',
      phoneNumber: '0000000000',
      address: 'Blood Bank Administration'
    });
    console.log(`Administrator account created: ${config.adminUsername}`);
  }
} catch (error) {
  console.error(`Unable to create administrator: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
