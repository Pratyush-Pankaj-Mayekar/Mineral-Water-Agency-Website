import { Router } from 'express';
import { requireCustomer } from '../middleware/auth.js';
import { appError } from '../middleware/errors.js';
import { addCartItem, updateCartItem, removeCartItem, clearCart, getCart, getWishlist, addWishlistItem, removeWishlistItem, listAddresses, saveAddress, deleteAddress, createPaymentIntent, verifyPayment, getOrdersForUser, getOrder } from '../services/store.js';
import { asPositiveInt } from '../utils/validation.js';

const router = Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(['/cart', '/wishlist', '/addresses', '/orders', '/payment'], requireCustomer);

router.get('/cart', asyncRoute(async (req, res) => res.json({ items: await getCart(req.auth.id) })));
router.post('/cart', asyncRoute(async (req, res) => {
  const productId = asPositiveInt(req.body.productId, 'Product');
  const quantity = req.body.quantity === undefined ? 1 : asPositiveInt(req.body.quantity, 'Quantity');
  const item = await addCartItem(req.auth.id, productId, quantity);
  res.status(201).json({ item, items: await getCart(req.auth.id) });
}));
router.put('/cart/:id', asyncRoute(async (req, res) => {
  const items = await updateCartItem(req.auth.id, asPositiveInt(req.params.id, 'Cart item'), req.body.quantity);
  res.json({ items });
}));
router.delete('/cart/:id', asyncRoute(async (req, res) => {
  await removeCartItem(req.auth.id, asPositiveInt(req.params.id, 'Cart item'));
  res.json({ success: true, items: await getCart(req.auth.id) });
}));
router.delete('/cart', asyncRoute(async (req, res) => { await clearCart(req.auth.id); res.json({ success: true, items: [] }); }));

router.get('/wishlist', asyncRoute(async (req, res) => res.json({ products: await getWishlist(req.auth.id) })));
router.post('/wishlist', asyncRoute(async (req, res) => {
  const products = await addWishlistItem(req.auth.id, asPositiveInt(req.body.productId, 'Product'));
  res.status(201).json({ products });
}));
router.delete('/wishlist/:productId', asyncRoute(async (req, res) => {
  const products = await removeWishlistItem(req.auth.id, asPositiveInt(req.params.productId, 'Product'));
  res.json({ products });
}));

router.get('/addresses', asyncRoute(async (req, res) => res.json({ addresses: await listAddresses(req.auth.id) })));
router.post('/addresses', asyncRoute(async (req, res) => res.status(201).json({ address: await saveAddress(req.auth.id, req.body) })));
router.put('/addresses/:id', asyncRoute(async (req, res) => res.json({ address: await saveAddress(req.auth.id, req.body, asPositiveInt(req.params.id, 'Address')) })));
router.delete('/addresses/:id', asyncRoute(async (req, res) => { await deleteAddress(req.auth.id, asPositiveInt(req.params.id, 'Address')); res.json({ success: true }); }));

router.get('/orders', asyncRoute(async (req, res) => res.json({ orders: await getOrdersForUser(req.auth.id) })));
router.post('/orders', asyncRoute(async (req, res) => {
  const addressId = asPositiveInt(req.body.addressId, 'Delivery address');
  const intent = await createPaymentIntent(req.auth.id, addressId, req.body.promoCode || '', req.body.paymentMethod || 'MOCK');
  res.status(201).json(intent);
}));
router.get('/orders/:id', asyncRoute(async (req, res) => {
  const order = await getOrder(req.params.id, req.auth.id);
  if (!order) throw appError('Order not found.', 404);
  res.json({ order });
}));
router.post('/payment/create', asyncRoute(async (req, res) => {
  const addressId = asPositiveInt(req.body.addressId, 'Delivery address');
  const intent = await createPaymentIntent(req.auth.id, addressId, req.body.promoCode || '', req.body.paymentMethod || 'MOCK');
  res.status(201).json(intent);
}));
router.post('/payment/verify', asyncRoute(async (req, res) => {
  const orderId = asPositiveInt(req.body.orderId, 'Order');
  const outcome = req.body.outcome === 'failed' ? 'failed' : 'success';
  const order = await verifyPayment(orderId, req.auth.id, outcome);
  res.json({ order, success: order.paymentStatus === 'PAID', message: order.paymentStatus === 'PAID' ? 'Payment successful. Order placed.' : 'Payment was not completed.' });
}));

export default router;
