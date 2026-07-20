import sqlite3 from 'sqlite3';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { BloodInventory, Donation, Donor, Hospital, User, bloodGroups } from '../src/models.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const db = new sqlite3.Database(path.join(root, 'data', 'legacy-django.sqlite3'));
const all = promisify(db.all.bind(db));
await mongoose.connect(config.mongoUri);

const tables = new Set((await all("SELECT name FROM sqlite_master WHERE type='table'")).map(row => row.name));
if (tables.has('BM_recipienthospital')) {
  for (const row of await all('SELECT * FROM BM_recipienthospital')) await Hospital.updateOne({ legacyId: row.id }, { $set: { name: row.hospital_name, address: row.address, mainDoctor: row.main_doctor_name, contactNumber: row.contact_number, email: row.email, mainDomain: row.main_domain, legacyId: row.id } }, { upsert: true });
}
if (tables.has('BM_customuser')) {
  for (const row of await all('SELECT * FROM BM_customuser')) {
    const user = await User.findOneAndUpdate({ username: row.username }, { $setOnInsert: { email: row.email || `${row.username}@legacy.local`, password: await bcrypt.hash(`ChangeMe-${row.id}!`, 12), userType: row.is_superuser ? 'admin' : 'donor', phoneNumber: 'Not provided', address: 'Imported from Django' } }, { upsert: true, new: true });
    const donorRow = tables.has('BM_donor') ? (await all('SELECT * FROM BM_donor WHERE user_id = ?', [row.id]))[0] : null;
    if (donorRow) await Donor.updateOne({ user: user._id }, { $set: { bloodGroup: donorRow.blood_group, lastDonationDate: donorRow.last_donation, medicalCheckupDate: donorRow.last_medical_checkup, legacyId: donorRow.id } }, { upsert: true });
  }
}
if (tables.has('BM_blooddonation')) {
  for (const row of await all('SELECT * FROM BM_blooddonation')) await Donation.updateOne({ legacyId: row.id }, { $set: { name: row.name, bloodGroup: row.blood_group, hemoglobin: row.hemoglobin, disease: row.disease, lastDonationMonths: row.last_donation, lastCheckupMonths: row.last_checkup, donatedAt: row.submitted_at, legacyId: row.id } }, { upsert: true });
}
for (const bloodGroup of bloodGroups) await BloodInventory.updateOne({ bloodGroup }, { $setOnInsert: { unitsAvailable: 0 } }, { upsert: true });
console.log('SQLite data migration completed. Imported legacy users use ChangeMe-<old id>! and should reset their passwords.');
db.close();
await mongoose.disconnect();
