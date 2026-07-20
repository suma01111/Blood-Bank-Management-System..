import { Router } from 'express';
import { BloodInventory, BloodRequest, Donation, Donor, Hospital, Recipient, User, bloodGroups } from '../models.js';
import { allow, protect } from '../middleware/auth.js';
import { findMatchingDonors } from '../services/matching.js';

const router = Router();
const inventory = () => BloodInventory.find().sort({ bloodGroup: 1 });

router.get('/public/inventory', async (_req, res, next) => { try { res.json({ inventory: await inventory() }); } catch (e) { next(e); } });
router.use(protect);

router.get('/dashboard', async (req, res, next) => {
  try {
    const response = { user: req.user, inventory: await inventory() };
    if (req.user.userType === 'donor') response.donor = await Donor.findOne({ user: req.user._id });
    if (req.user.userType === 'recipient') {
      response.recipient = await Recipient.findOne({ user: req.user._id }).populate('hospital');
      response.requests = response.recipient ? await BloodRequest.find({ recipient: response.recipient._id }).sort({ createdAt: -1 }) : [];
    }
    if (req.user.userType === 'admin') {
      const [donors, recipients, hospitals, pendingRequests, totalRequests, completedRequests, units] = await Promise.all([
        Donor.countDocuments(), Recipient.countDocuments(), Hospital.countDocuments(), BloodRequest.countDocuments({ status: 'pending' }),
        BloodRequest.countDocuments(), BloodRequest.countDocuments({ status: 'completed' }),
        BloodInventory.aggregate([{ $group: { _id: null, total: { $sum: '$unitsAvailable' } } }])
      ]);
      response.stats = { donors, recipients, hospitals, pendingRequests, totalRequests, completedRequests, totalRecords: donors + recipients, unitsAvailable: units[0]?.total || 0, fulfillmentRate: totalRequests ? Math.round((completedRequests / totalRequests) * 100) : 0 };
    }
    res.json(response);
  } catch (e) { next(e); }
});

router.post('/donations', allow('donor'), async (req, res, next) => {
  try {
    const { bloodGroup, medicalCheckupDate, eligibility } = req.body;
    if (!bloodGroups.includes(bloodGroup) || !medicalCheckupDate) return res.status(400).json({ message: 'Blood group and medical checkup date are required.' });
    if (!eligibility || Object.values(eligibility).some(value => value !== true)) return res.status(400).json({ message: 'You must confirm every eligibility item.' });
    const donor = await Donor.findOneAndUpdate({ user: req.user._id }, { bloodGroup, medicalCheckupDate, lastDonationDate: new Date(), isEligible: true }, { new: true, upsert: true });
    await Donation.create({ donor: donor._id, name: req.user.username, bloodGroup, medicalCheckupDate });
    await BloodInventory.findOneAndUpdate({ bloodGroup }, { $inc: { unitsAvailable: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(201).json({ message: 'Thank you for your donation!', donor });
  } catch (e) { next(e); }
});

router.get('/hospitals', async (_req, res, next) => { try { res.json({ hospitals: await Hospital.find().sort({ name: 1 }) }); } catch (e) { next(e); } });
router.post('/requests', allow('recipient'), async (req, res, next) => {
  try {
    const { bloodGroup, hospital, unitsRequired, urgencyLevel } = req.body;
    if (!bloodGroups.includes(bloodGroup) || !hospital || !Number.isInteger(Number(unitsRequired)) || unitsRequired < 1 || unitsRequired > 10 || !['high', 'medium', 'low'].includes(urgencyLevel)) return res.status(400).json({ message: 'Please provide valid request details.' });
    if (!(await Hospital.exists({ _id: hospital }))) return res.status(404).json({ message: 'Hospital not found.' });
    const recipient = await Recipient.findOneAndUpdate({ user: req.user._id }, { bloodGroup, hospital, unitsRequired, urgencyLevel }, { new: true, upsert: true });
    const request = await BloodRequest.create({ recipient: recipient._id });
    res.status(201).json({ message: 'Your blood request has been submitted.', request });
  } catch (e) { next(e); }
});

router.get('/admin/hospitals', allow('admin'), async (_req, res, next) => { try { res.json({ hospitals: await Hospital.find().sort({ name: 1 }) }); } catch (e) { next(e); } });
router.post('/admin/hospitals', allow('admin'), async (req, res, next) => { try { res.status(201).json({ message: 'Hospital added successfully.', hospital: await Hospital.create(req.body) }); } catch (e) { next(e); } });
router.put('/admin/hospitals/:id', allow('admin'), async (req, res, next) => { try { const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!hospital) return res.status(404).json({ message: 'Hospital not found.' }); res.json({ message: 'Hospital updated successfully.', hospital }); } catch (e) { next(e); } });
router.delete('/admin/hospitals/:id', allow('admin'), async (req, res, next) => { try { if (await Recipient.exists({ hospital: req.params.id })) return res.status(409).json({ message: 'This hospital is used by a recipient and cannot be deleted.' }); const hospital = await Hospital.findByIdAndDelete(req.params.id); if (!hospital) return res.status(404).json({ message: 'Hospital not found.' }); res.json({ message: 'Hospital deleted successfully.' }); } catch (e) { next(e); } });

router.get('/admin/requests', allow('admin'), async (_req, res, next) => {
  try {
    const requests = await BloodRequest.find().populate({ path: 'recipient', populate: [{ path: 'user', select: '-password' }, { path: 'hospital' }] }).sort({ createdAt: -1 });
    const counts = Object.fromEntries(await Promise.all(['pending', 'approved', 'rejected', 'completed'].map(async status => [status, await BloodRequest.countDocuments({ status })])));
    res.json({ requests, counts, inventory: await inventory() });
  } catch (e) { next(e); }
});

router.patch('/admin/requests/:id/status', allow('admin'), async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid request status.' });
    const request = await BloodRequest.findById(req.params.id).populate('recipient');
    if (!request) return res.status(404).json({ message: 'Blood request not found.' });
    if (status === 'approved' && request.status !== 'approved') {
      const stock = await BloodInventory.findOneAndUpdate(
        { bloodGroup: request.recipient.bloodGroup, unitsAvailable: { $gte: request.recipient.unitsRequired } },
        { $inc: { unitsAvailable: -request.recipient.unitsRequired } },
        { new: true }
      );
      if (!stock) return res.status(409).json({ message: 'There are not enough units in inventory for this request.' });
    }
    if (request.status === 'approved' && !['approved', 'completed'].includes(status)) {
      await BloodInventory.updateOne({ bloodGroup: request.recipient.bloodGroup }, { $inc: { unitsAvailable: request.recipient.unitsRequired } });
    }
    request.status = status;
    await request.save();
    res.json({ message: `Request status updated to ${status}.`, request });
  } catch (e) { next(e); }
});

router.get('/admin/requests/:id/matches', allow('admin'), async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate('recipient');
    if (!request) return res.status(404).json({ message: 'Blood request not found.' });
    res.json({ matches: await findMatchingDonors(request.recipient) });
  } catch (error) { next(error); }
});

export default router;
