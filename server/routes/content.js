import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireCustomer } from '../middleware/auth.js';
import { appError } from '../middleware/errors.js';
import { cleanText, validEmail, validPhone, asPositiveInt } from '../utils/validation.js';
import { listReviews, createReview, createContactMessage, listPromotions } from '../services/store.js';

const router = Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many messages have been sent. Please try again later.' } });

router.get('/reviews', asyncRoute(async (req, res) => {
  const productId = req.query.productId ? asPositiveInt(req.query.productId, 'Product') : null;
  res.json({ reviews: await listReviews({ productId }) });
}));
router.post('/reviews', requireCustomer, asyncRoute(async (req, res) => {
  const review = await createReview(req.auth.id, req.body);
  res.status(201).json({ review, message: 'Thanks for your review. It will appear after a quick moderation check.' });
}));
router.post('/contact', contactLimiter, asyncRoute(async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 180);
  const phone = cleanText(req.body.phone, 30);
  const subject = cleanText(req.body.subject, 180);
  const message = cleanText(req.body.message, 3000);
  if (name.length < 2 || !validEmail(email) || phone && !validPhone(phone) || !subject || message.length < 10) throw appError('Please check your contact details and message.');
  const result = await createContactMessage({ name, email, phone, subject, message });
  res.status(201).json({ ...result, message: 'Your message has been received. Our team will be in touch soon.' });
}));
router.get('/promotions', asyncRoute(async (_req, res) => res.json({ promotions: await listPromotions(true) })));

export default router;
