import '../config/env.js';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

const cookieName = 'pure_aqua_session';
const ephemeralDevelopmentSecret = randomBytes(32).toString('hex');
const configuredSecret = process.env.JWT_SECRET;
const secret = () => configuredSecret && !configuredSecret.includes('replace-with') ? configuredSecret : ephemeralDevelopmentSecret;

export function setSessionCookie(res, payload) {
  const token = jwt.sign(payload, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production', path: '/' });
}

export function authenticate(req, res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    req.auth = jwt.verify(token, secret());
    next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function requireCustomer(req, res, next) {
  authenticate(req, res, () => {
    if (req.auth?.role !== 'customer') return res.status(403).json({ message: 'Customer access is required.' });
    next();
  });
}

export function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.auth?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
    next();
  });
}

export function getJwtSecret() {
  return secret();
}
