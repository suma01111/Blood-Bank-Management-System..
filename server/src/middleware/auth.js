import jwt from 'jsonwebtoken';
import { config } from '../../src/config.js';
import { User } from '../models.js';

export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).json({ message: 'Account no longer exists.' });
    next();
  } catch {
    res.status(401).json({ message: 'Your session is invalid or has expired.' });
  }
}

export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user?.userType) ? next() : res.status(403).json({ message: 'You do not have permission to do that.' });
