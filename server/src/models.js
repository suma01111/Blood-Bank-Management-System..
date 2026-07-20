import mongoose from 'mongoose';

const opts = { timestamps: true };
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  userType: { type: String, enum: ['donor', 'recipient', 'admin'], required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true }
}, opts);
userSchema.index({ userType: 1, createdAt: -1 });

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  mainDoctor: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  mainDomain: { type: String, default: 'General Medicine' },
  legacyId: Number
}, opts);
hospitalSchema.index({ name: 1 });

const donorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bloodGroup: { type: String, enum: bloodGroups, default: 'O+' },
  lastDonationDate: Date,
  medicalCheckupDate: Date,
  isEligible: { type: Boolean, default: true },
  legacyId: Number
}, opts);
donorSchema.index({ bloodGroup: 1, isEligible: 1, lastDonationDate: 1 });

const recipientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bloodGroup: { type: String, enum: bloodGroups, default: 'O+' },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  unitsRequired: { type: Number, min: 1, max: 10, default: 1 },
  urgencyLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, opts);
recipientSchema.index({ bloodGroup: 1, urgencyLevel: 1 });

const inventorySchema = new mongoose.Schema({
  bloodGroup: { type: String, enum: bloodGroups, unique: true, required: true },
  unitsAvailable: { type: Number, min: 0, default: 0 }
}, opts);

const requestSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' }
}, opts);
requestSchema.index({ status: 1, createdAt: -1 });

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  name: { type: String, required: true },
  bloodGroup: { type: String, enum: bloodGroups, required: true },
  hemoglobin: { type: Number, min: 0, max: 18 },
  disease: { type: String, default: 'None' },
  lastDonationMonths: Number,
  lastCheckupMonths: Number,
  medicalCheckupDate: Date,
  legacyId: Number,
  donatedAt: { type: Date, default: Date.now }
}, opts);

export const User = mongoose.model('User', userSchema);
export const Hospital = mongoose.model('Hospital', hospitalSchema);
export const Donor = mongoose.model('Donor', donorSchema);
export const Recipient = mongoose.model('Recipient', recipientSchema);
export const BloodInventory = mongoose.model('BloodInventory', inventorySchema);
export const BloodRequest = mongoose.model('BloodRequest', requestSchema);
export const Donation = mongoose.model('Donation', donationSchema);
export { bloodGroups };
