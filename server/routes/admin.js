import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { requireAdmin, setSessionCookie, clearSessionCookie } from '../middleware/auth.js';
import { appError } from '../middleware/errors.js';
import { asPositiveInt, asMoney, cleanText, validEmail } from '../utils/validation.js';
import { findAdminByEmail, findAdminById, getAdminDashboard, getAnalytics, getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, listInventory, updateInventory, getAdminOrders, getOrder, updateOrderStatus, updateOrderPaymentStatus, getCustomerList, listReviews, moderateReview, deleteReview, listContactMessages, updateContactMessage, listPromotions, savePromotion, deletePromotion, getSettings, updateSettings } from '../services/store.js';

const router = Router();
const uploadDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/public/uploads');
mkdirSync(uploadDirectory, { recursive: true });
const imageExtensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const imageUpload = multer({
  storage: multer.diskStorage({ destination: uploadDirectory, filename: (_req, file, callback) => callback(null, `${randomUUID()}${imageExtensions[file.mimetype] || '.img'}`) }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => imageExtensions[file.mimetype] ? callback(null, true) : callback(appError('Upload a JPG, PNG or WebP image (3 MB maximum).')),
});
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many admin login attempts. Please wait and try again.' } });
const emailClean = (value) => String(value || '').trim().toLowerCase();

router.post('/auth/login', adminLimiter, asyncRoute(async (req, res) => {
  const email = emailClean(req.body.email);
  const password = String(req.body.password || '');
  if (!validEmail(email) || !password) throw appError('Enter your admin email and password.');
  const admin = await findAdminByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) throw appError('Email or password is incorrect.', 401);
  setSessionCookie(res, { id: admin.id, email: admin.email, role: 'admin' });
  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
}));
router.get('/auth/me', requireAdmin, asyncRoute(async (req, res) => {
  const admin = await findAdminById(req.auth.id);
  if (!admin) throw appError('Admin account not found.', 404);
  res.json({ admin });
}));
router.post('/auth/logout', (_req, res) => { clearSessionCookie(res); res.json({ success: true }); });
router.use(requireAdmin);
router.post('/upload', imageUpload.single('image'), asyncRoute(async (req, res) => {
  if (!req.file) throw appError('Choose an image to upload.');
  const bytes = await readFile(req.file.path);
  const header = bytes.subarray(0, 12);
  const validSignature = req.file.mimetype === 'image/jpeg'
    ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    : req.file.mimetype === 'image/png'
      ? header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
  if (!validSignature) {
    await unlink(req.file.path).catch(() => {});
    throw appError('The uploaded file is not a valid JPG, PNG or WebP image.');
  }
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}`, fileName: req.file.filename, size: req.file.size });
}));

router.get('/dashboard', asyncRoute(async (_req, res) => res.json(await getAdminDashboard())));
router.get('/analytics', asyncRoute(async (_req, res) => res.json(await getAnalytics())));

router.get('/products', asyncRoute(async (_req, res) => res.json({ products: await getProducts({ includeDisabled: true, sort: 'newest' }), categories: await getCategories() })));
router.post('/products', asyncRoute(async (req, res) => {
  const payload = normalizeProductBody(req.body);
  const product = await createProduct(payload);
  res.status(201).json({ product });
}));
router.put('/products/:id', asyncRoute(async (req, res) => {
  const product = await updateProduct(asPositiveInt(req.params.id, 'Product'), normalizeProductBody(req.body));
  res.json({ product });
}));
router.delete('/products/:id', asyncRoute(async (req, res) => {
  await deleteProduct(asPositiveInt(req.params.id, 'Product'));
  res.json({ success: true, message: 'Product disabled and removed from the storefront.' });
}));
router.get('/categories', asyncRoute(async (_req, res) => res.json({ categories: await getCategories() })));
router.post('/categories', asyncRoute(async (req, res) => res.status(201).json({ category: await createCategory(req.body) })));

router.get('/inventory', asyncRoute(async (_req, res) => {
  const [products, settings] = await Promise.all([listInventory(), getSettings()]);
  res.json({ products, lowStockThreshold: Number(settings.lowStockThreshold ?? 15) });
}));
router.patch('/inventory/:id', asyncRoute(async (req, res) => {
  const product = await updateInventory(asPositiveInt(req.params.id, 'Product'), req.body.stock);
  res.json({ product });
}));

router.get('/orders', asyncRoute(async (req, res) => res.json({ orders: await getAdminOrders({ search: req.query.search, status: req.query.status }) })));
router.get('/orders/:id', asyncRoute(async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) throw appError('Order not found.', 404);
  res.json({ order });
}));
router.put('/orders/:id/status', asyncRoute(async (req, res) => {
  const order = await updateOrderStatus(asPositiveInt(req.params.id, 'Order'), String(req.body.status || '').toUpperCase());
  res.json({ order });
}));
router.put('/orders/:id/payment', asyncRoute(async (req, res) => {
  const order = await updateOrderPaymentStatus(asPositiveInt(req.params.id, 'Order'), String(req.body.paymentStatus || '').toUpperCase());
  res.json({ order });
}));

router.get('/customers', asyncRoute(async (_req, res) => res.json({ customers: await getCustomerList() })));
router.get('/reviews', asyncRoute(async (_req, res) => res.json({ reviews: await listReviews({ includeAll: true }) })));
router.put('/reviews/:id', asyncRoute(async (req, res) => res.json({ review: await moderateReview(asPositiveInt(req.params.id, 'Review'), String(req.body.status || '').toUpperCase()) })));
router.delete('/reviews/:id', asyncRoute(async (req, res) => { await deleteReview(asPositiveInt(req.params.id, 'Review')); res.json({ success: true }); }));
router.get('/messages', asyncRoute(async (req, res) => res.json({ messages: await listContactMessages(req.query.status || '') })));
router.put('/messages/:id', asyncRoute(async (req, res) => res.json({ message: await updateContactMessage(asPositiveInt(req.params.id, 'Message'), String(req.body.status || '').toUpperCase()) })));

router.get('/promotions', asyncRoute(async (_req, res) => res.json({ promotions: await listPromotions(false) })));
router.post('/promotions', asyncRoute(async (req, res) => res.status(201).json({ promotion: await savePromotion(req.body) })));
router.put('/promotions/:id', asyncRoute(async (req, res) => res.json({ promotion: await savePromotion(req.body, asPositiveInt(req.params.id, 'Promotion')) })));
router.delete('/promotions/:id', asyncRoute(async (req, res) => { await deletePromotion(asPositiveInt(req.params.id, 'Promotion')); res.json({ success: true }); }));

router.get('/settings', asyncRoute(async (_req, res) => res.json({ settings: await getSettings() })));
router.put('/settings', asyncRoute(async (req, res) => res.json({ settings: await updateSettings(req.body) })));

function normalizeProductBody(body) {
  const name = cleanText(body.name, 160);
  const description = cleanText(body.description, 2000);
  const imageUrl = cleanText(body.imageUrl || '/images/product-500ml.svg', 500);
  const sizeLabel = cleanText(body.sizeLabel, 60);
  const categoryId = asPositiveInt(body.categoryId, 'Category');
  const price = asMoney(body.price);
  const discountPrice = body.discountPrice === '' || body.discountPrice == null ? null : asMoney(body.discountPrice, 'Discount price');
  const stock = body.stock === undefined ? 0 : asPositiveIntOrZero(body.stock);
  if (!name || !description || !sizeLabel) throw appError('Product name, size and description are required.');
  if (discountPrice !== null && discountPrice >= price) throw appError('Discount price must be less than regular price.');
  if (!imageUrl.startsWith('/') && !/^https:\/\//i.test(imageUrl)) throw appError('Use a local image path or a secure https image URL.');
  return { name, description, imageUrl, sizeLabel, categoryId, price, discountPrice, stock, enabled: body.enabled !== false && body.enabled !== 'false', slug: body.slug };
}
function asPositiveIntOrZero(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw appError('Stock must be zero or a positive whole number.');
  return n;
}

export default router;
