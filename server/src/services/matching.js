import { Donor } from '../models.js';

const compatibleDonors = {
  'A+': ['A+', 'A-', 'O+', 'O-'], 'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'], 'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'], 'O-': ['O-']
};

export async function findMatchingDonors(recipient, limit = 10) {
  const groups = compatibleDonors[recipient.bloodGroup] || [recipient.bloodGroup];
  const eligibleBefore = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
  const donors = await Donor.find({
    bloodGroup: { $in: groups },
    isEligible: true,
    $or: [{ lastDonationDate: null }, { lastDonationDate: { $lte: eligibleBefore } }]
  }).populate('user', 'username phoneNumber address').lean();

  return donors.map(donor => ({
    donor,
    score: (donor.bloodGroup === recipient.bloodGroup ? 70 : 50) + (!donor.lastDonationDate ? 20 : 10) + (donor.medicalCheckupDate ? 10 : 0)
  })).sort((a, b) => b.score - a.score).slice(0, limit);
}
