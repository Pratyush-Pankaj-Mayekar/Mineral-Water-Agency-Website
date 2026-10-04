import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { setSessionCookie, clearSessionCookie, requireCustomer, requireAdmin } from '../middleware/auth.js';
import { appError } from '../middleware/errors.js';
import { cleanText, validEmail, validPhone } from '../utils/validation.js';
import { createUser, findUserByEmail, findUserById, updateUser, setPasswordReset, findUserByResetHash, saveResetPassword, findAdminByEmail, findAdminById } from '../services/store.js';

const router = Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many attempts. Please wait a little and try again.' } });
const emailClean = (value) => String(value || '').trim().toLowerCase();
const emailValid = (value) => validEmail(value) && String(value).length <= 180;

router.post('/register', authLimiter, asyncRoute(async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const email = emailClean(req.body.email);
  const phone = cleanText(req.body.phone, 30);
  const password = String(req.body.password || '');
  if (name.length < 2 || !emailValid(email) || !validPhone(phone)) throw appError('Enter your name, a valid email and a valid phone number.');
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) throw appError('Use at least 8 characters with a capital letter, a lowercase letter and a number.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, phone, passwordHash });
  setSessionCookie(res, { id: user.id, email: user.email, role: 'customer' });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt } });
}));

router.post('/login', authLimiter, asyncRoute(async (req, res) => {
  const email = emailClean(req.body.email);
  const password = String(req.body.password || '');
  if (!emailValid(email) || !password) throw appError('Enter a valid email and password.');
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw appError('Email or password is incorrect.', 401);
  setSessionCookie(res, { id: user.id, email: user.email, role: 'customer' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt } });
}));

router.get('/me', requireCustomer, asyncRoute(async (req, res) => {
  const user = await findUserById(req.auth.id);
  if (!user) throw appError('Account not found.', 404);
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt } });
}));

router.post('/logout', (req, res) => { clearSessionCookie(res); res.json({ success: true }); });

router.put('/profile', requireCustomer, asyncRoute(async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const phone = cleanText(req.body.phone, 30);
  if (name.length < 2 || !validPhone(phone)) throw appError('Enter a valid name and phone number.');
  const user = await updateUser(req.auth.id, { name, phone });
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt } });
}));

router.post('/forgot-password', authLimiter, asyncRoute(async (req, res) => {
  const email = emailClean(req.body.email);
  if (!emailValid(email)) throw appError('Enter a valid email address.');
  const user = await findUserByEmail(email);
  const response = { message: 'If an account exists for that email, password reset instructions are ready.' };
  if (user) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await setPasswordReset(email, tokenHash, expiresAt);
    // A one-time reset token is returned only by the non-production demo flow.
    if (process.env.NODE_ENV !== 'production') response.demoResetToken = token;
  }
  res.json(response);
}));

router.post('/reset-password', authLimiter, asyncRoute(async (req, res) => {
  const token = String(req.body.token || '').trim();
  const email = emailClean(req.body.email);
  const password = String(req.body.password || '');
  if (!token || !emailValid(email)) throw appError('The reset link is invalid or expired.');
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) throw appError('Use at least 8 characters with a capital letter, a lowercase letter and a number.');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const user = await findUserByResetHash(tokenHash);
  if (!user || emailClean(user.email) !== email) throw appError('The reset link is invalid or expired.', 400);
  await saveResetPassword(user.id, await bcrypt.hash(password, 12));
  res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
}));

router.post('/admin/login', authLimiter, asyncRoute(async (req, res) => {
  const email = emailClean(req.body.email);
  const password = String(req.body.password || '');
  if (!emailValid(email) || !password) throw appError('Enter your admin email and password.');
  const admin = await findAdminByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) throw appError('Email or password is incorrect.', 401);
  setSessionCookie(res, { id: admin.id, email: admin.email, role: 'admin' });
  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
}));
router.get('/admin/me', requireAdmin, asyncRoute(async (req, res) => {
  const admin = await findAdminById(req.auth.id);
  if (!admin) throw appError('Admin account not found.', 404);
  res.json({ admin });
}));

export default router;
