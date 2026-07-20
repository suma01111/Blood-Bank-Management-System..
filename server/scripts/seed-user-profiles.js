import mongoose from 'mongoose';
import { config } from '../src/config.js';
import { BloodRequest, Donor, Hospital, Recipient, User } from '../src/models.js';

try {
  await mongoose.connect(config.mongoUri);
  const hospital = await Hospital.findOne().sort({ name: 1 });
  if (!hospital) throw new Error('No hospitals exist. Run pnpm seed:demo first.');

  const pooja = await User.findOne({ username: 'pooja' });
  if (pooja) {
    const recipient = await Recipient.findOneAndUpdate(
      { user: pooja._id },
      { user: pooja._id, bloodGroup: 'B+', hospital: hospital._id, unitsRequired: 2, urgencyLevel: 'high' },
      { upsert: true, new: true, runValidators: true }
    );
    await BloodRequest.findOneAndUpdate(
      { recipient: recipient._id },
      { $setOnInsert: { recipient: recipient._id, status: 'pending' } },
      { upsert: true, new: true }
    );
    console.log(`Recipient profile completed for pooja at ${hospital.name}.`);
  } else {
    console.log('Recipient pooja was not found; no personal profile was changed.');
  }

  const dipu = await User.findOne({ username: 'dipu' });
  if (dipu) {
    const checkup = new Date(); checkup.setDate(checkup.getDate() - 14);
    const donation = new Date(); donation.setDate(donation.getDate() - 92);
    await Donor.findOneAndUpdate(
      { user: dipu._id },
      { user: dipu._id, bloodGroup: 'O+', medicalCheckupDate: checkup, lastDonationDate: donation, isEligible: true },
      { upsert: true, new: true, runValidators: true }
    );
    console.log('Donor profile completed for dipu.');
  } else {
    console.log('Donor dipu was not found; no personal profile was changed.');
  }
} catch (error) {
  console.error(`Unable to complete user profiles: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
