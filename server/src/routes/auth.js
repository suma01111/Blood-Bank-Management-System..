import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Donor, Recipient } from '../models.js';
import { config } from '../config.js';
import { protect } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();
const tokenFor = user => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });
const publicUser = user => ({ id: user._id, username: user.username, email: user.email, userType: user.userType, phoneNumber: user.phoneNumber, address: user.address });

router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, phoneNumber, address, userType, password, passwordConfirm } = req.body;
    if (!username || !email || !phoneNumber || !address || !userType || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (!['donor', 'recipient'].includes(userType)) return res.status(400).json({ message: 'Public registration is available only for donors and recipients.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    if (password !== passwordConfirm) return res.status(400).json({ message: 'Passwords do not match.' });
    if (await User.exists({ $or: [{ username }, { email: email.toLowerCase() }] })) return res.status(409).json({ message: 'Username or email is already registered.' });
    const user = await User.create({ username, email, phoneNumber, address, userType, password: await bcrypt.hash(password, 12) });
    if (userType === 'donor') await Donor.create({ user: user._id });
    if (userType === 'recipient') await Recipient.create({ user: user._id });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    logger.requestError(req, error, 'Signup failed');
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = req.body.username?.trim();
    if (!username || !req.body.password) return res.status(400).json({ message: 'Username and password are required.' });
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      logger.warn('Login rejected', { username, reason: user ? 'invalid-password' : 'unknown-user' });
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    logger.info('Login successful', { username, userType: user.userType });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    logger.requestError(req, error, 'Login failed');
    next(error);
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
