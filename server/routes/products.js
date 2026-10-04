import { Router } from 'express';
import { getCategories, getProducts, getProduct, getPublicStoreInfo } from '../services/store.js';
import { appError } from '../middleware/errors.js';

const router = Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/categories', asyncRoute(async (_req, res) => res.json({ categories: await getCategories() })));
router.get('/store-info', asyncRoute(async (_req, res) => res.json({ settings: await getPublicStoreInfo() })));
router.get('/products', asyncRoute(async (req, res) => {
  const filters = {
    search: req.query.search, category: req.query.category, minPrice: req.query.minPrice, maxPrice: req.query.maxPrice,
    size: req.query.size, available: req.query.available, rating: req.query.rating, sort: req.query.sort,
  };
  const products = await getProducts(filters);
  res.json({ products, count: products.length });
}));
router.get('/products/:id', asyncRoute(async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) throw appError('Product not found.', 404);
  res.json({ product });
}));

export default router;
