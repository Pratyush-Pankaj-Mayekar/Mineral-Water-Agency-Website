import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { pool, isMysql } from '../config/db.js';
import { seedCategories, seedProducts, seedPromotions } from '../data/seed-data.js';
import { appError } from '../middleware/errors.js';
import { validEmail, validPhone } from '../utils/validation.js';

const clone = (value) => structuredClone(value);
const iso = () => new Date().toISOString();
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const toBool = (value) => value === true || value === 1 || value === '1';
const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
};

let state = null;
let nextIds = {};
const id = (table) => (nextIds[table] = (nextIds[table] || 0) + 1);

function mapProduct(row) {
  if (!row) return null;
  const product = {
    id: Number(row.id), categoryId: Number(row.categoryId ?? row.category_id ?? 0),
    category: row.categoryName ?? row.category_name ?? row.category ?? '',
    name: row.name, slug: row.slug, sizeLabel: row.sizeLabel ?? row.size_label ?? '',
    description: row.description, imageUrl: row.imageUrl ?? row.image_url ?? '/images/product-500ml.svg',
    price: Number(row.price), discountPrice: (row.discountPrice ?? row.discount_price) == null ? null : Number(row.discountPrice ?? row.discount_price),
    stock: Number(row.stock ?? 0), rating: Number(row.rating ?? row.rating_avg ?? 0),
    reviewCount: Number(row.reviewCount ?? row.review_count ?? 0), enabled: row.enabled === undefined ? true : toBool(row.enabled),
    createdAt: row.createdAt ?? row.created_at,
  };
  product.available = product.enabled && product.stock > 0;
  product.effectivePrice = product.discountPrice !== null && product.discountPrice < product.price ? product.discountPrice : product.price;
  return product;
}

function mapUser(row) {
  if (!row) return null;
  return { id: Number(row.id), name: row.name, email: row.email, phone: row.phone || '', passwordHash: row.passwordHash ?? row.password_hash, createdAt: row.createdAt ?? row.created_at };
}
function publicUser(row) {
  if (!row) return null;
  const { passwordHash, password_hash, resetTokenHash, reset_token_hash, resetExpires, reset_expires, ...safe } = row;
  return safe;
}
function mapAddress(row) {
  if (!row) return null;
  return { id: Number(row.id), userId: Number(row.userId ?? row.user_id), fullName: row.fullName ?? row.full_name, phone: row.phone, addressLine: row.addressLine ?? row.address_line, city: row.city, state: row.state, pincode: row.pincode, isDefault: toBool(row.isDefault ?? row.is_default), createdAt: row.createdAt ?? row.created_at };
}
function makeOrderNumber() {
  const year = new Date().getFullYear();
  return `PA-${year}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
function orderItemSnapshot(item) {
  const product = item.product || item;
  const unitPrice = Number(product.effectivePrice ?? (product.discountPrice ?? product.price));
  return {
    productId: Number(product.id), name: product.name, sizeLabel: product.sizeLabel, imageUrl: product.imageUrl,
    unitPrice, listPrice: Number(product.price), quantity: Number(item.quantity),
  };
}
function mapOrder(row, items = []) {
  if (!row) return null;
  const address = parseJson(row.address ?? row.address_snapshot) || row.address;
  return {
    id: Number(row.id), orderNumber: row.orderNumber ?? row.order_number, userId: Number(row.userId ?? row.user_id),
    customerName: row.customerName ?? row.customer_name, customerEmail: row.customerEmail ?? row.customer_email,
    status: row.status, paymentStatus: row.paymentStatus ?? row.payment_status, paymentMethod: row.paymentMethod ?? row.payment_method,
    subtotal: Number(row.subtotal || 0), discount: Number(row.discount || 0), deliveryCharge: Number(row.deliveryCharge ?? row.delivery_charge ?? 0),
    tax: Number(row.tax || 0), total: Number(row.total || 0), address, expectedDelivery: row.expectedDelivery ?? row.expected_delivery,
    createdAt: row.createdAt ?? row.created_at, items,
  };
}
function normalizeOrderItems(rows) {
  return (rows || []).map((r) => ({
    id: Number(r.id), productId: Number(r.productId ?? r.product_id), name: r.name ?? r.product_name,
    sizeLabel: r.sizeLabel ?? r.size_label, imageUrl: r.imageUrl ?? r.image_url, unitPrice: Number(r.unitPrice ?? r.unit_price),
    listPrice: Number(r.listPrice ?? r.list_price ?? r.unit_price), quantity: Number(r.quantity),
  }));
}

export async function initializeStore() {
  if (isMysql) return;
  if (state) return;
  const customerPasswordHash = bcrypt.hashSync('Aqua@1234', 10);
  const adminPasswordHash = bcrypt.hashSync('AquaAdmin@1234', 10);
  const now = iso();
  state = {
    categories: clone(seedCategories), products: clone(seedProducts),
    users: [{ id: 1, name: 'Aarav Mehta', email: 'customer@pureaqua.demo', phone: '+91 98765 43210', passwordHash: customerPasswordHash, createdAt: '2025-06-12T09:30:00.000Z' }],
    admins: [{ id: 1, name: 'Pure Aqua Admin', email: 'admin@pureaqua.demo', passwordHash: adminPasswordHash, createdAt: '2025-06-01T09:00:00.000Z' }],
    addresses: [{ id: 1, userId: 1, fullName: 'Aarav Mehta', phone: '+91 98765 43210', addressLine: '14, Lake View Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', isDefault: true, createdAt: now }],
    cartItems: [], wishlistItems: [],
    orders: [
      { id: 1, orderNumber: 'PA-2026-00081', userId: 1, status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'MOCK', subtotal: 60, discount: 0, deliveryCharge: 0, tax: 3, total: 63, address: { fullName: 'Aarav Mehta', phone: '+91 98765 43210', addressLine: '14, Lake View Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, expectedDelivery: '2026-09-26T12:00:00.000Z', createdAt: '2026-09-24T10:10:00.000Z', items: [{ productId: 3, name: '20L Jar', sizeLabel: '20 L', imageUrl: '/images/product-20l.svg', unitPrice: 30, listPrice: 30, quantity: 2 }] },
      { id: 2, orderNumber: 'PA-2026-00106', userId: 1, status: 'OUT_FOR_DELIVERY', paymentStatus: 'PAID', paymentMethod: 'MOCK', subtotal: 30, discount: 0, deliveryCharge: 25, tax: 1.5, total: 56.5, address: { fullName: 'Aarav Mehta', phone: '+91 98765 43210', addressLine: '14, Lake View Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, expectedDelivery: '2026-10-04T17:00:00.000Z', createdAt: '2026-10-03T08:15:00.000Z', items: [{ productId: 2, name: '1L Bottle', sizeLabel: '1 L', imageUrl: '/images/product-1l.svg', unitPrice: 15, listPrice: 15, quantity: 2 }] },
    ],
    reviews: [
      { id: 1, userId: 1, productId: 3, rating: 5, title: 'Easy office delivery', body: 'The 20L jar arrives on schedule and the ordering process is simple. A dependable everyday service.', status: 'APPROVED', createdAt: '2026-09-27T10:00:00.000Z' },
      { id: 2, userId: 1, productId: 2, rating: 5, title: 'Just right for the day', body: 'Good size to keep at my desk and the bottles are always neatly sealed.', status: 'APPROVED', createdAt: '2026-09-29T10:00:00.000Z' },
      { id: 3, userId: 1, productId: 4, rating: 4, title: 'A handy family size', body: 'Nice format for sharing at home. Ordering again soon.', status: 'PENDING', createdAt: '2026-10-02T10:00:00.000Z' },
    ],
    messages: [{ id: 1, name: 'Nisha Kulkarni', email: 'nisha@example.test', phone: '+91 90000 12345', subject: 'Delivery area', message: 'Could you please confirm delivery availability near Aundh?', status: 'NEW', createdAt: '2026-10-01T08:30:00.000Z' }],
    promotions: clone(seedPromotions), settings: { agencyName: 'Pure Aqua', supportEmail: 'hello@pureaqua.example', supportPhone: '+91 80000 12345', deliveryFee: 25, freeDeliveryThreshold: 299, lowStockThreshold: 15, address: 'Pune, Maharashtra' },
  };
  nextIds = { categories: 3, products: 5, users: 1, admins: 1, addresses: 1, cartItems: 0, wishlistItems: 0, orders: 2, reviews: 3, messages: 1, promotions: 2 };
  // Adjust the demo product summaries to match the approved demo reviews.
  state.products.find((p) => p.id === 2).rating = 4.9;
  state.products.find((p) => p.id === 2).reviewCount = 53;
}

export function databaseMode() { return isMysql ? 'mysql' : 'demo'; }

export async function getCategories() {
  if (!isMysql) return clone(state.categories);
  const [rows] = await pool.execute('SELECT id, name, slug, description FROM categories ORDER BY name');
  return rows.map((r) => ({ id: Number(r.id), name: r.name, slug: r.slug, description: r.description || '' }));
}
export async function createCategory(payload = {}) {
  const name = String(payload.name || '').trim().slice(0, 100);
  const description = String(payload.description || '').trim().slice(0, 500);
  if (name.length < 2) throw appError('Enter a category name with at least two characters.');
  const slug = String(payload.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
  if (!slug) throw appError('Choose a category name that can be used in a web address.');
  if (!isMysql) {
    if (state.categories.some((c) => c.slug === slug)) throw appError('That category already exists.', 409);
    const item = { id: id('categories'), name, slug, description };
    state.categories.push(item);
    return clone(item);
  }
  const [result] = await pool.execute('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description]);
  return { id: result.insertId, name, slug, description };
}

export async function getProducts(filters = {}) {
  if (!isMysql) {
    let products = state.products.filter((p) => filters.includeDisabled || p.enabled).map(mapProduct);
    const term = String(filters.search || '').trim().toLowerCase();
    if (term) products = products.filter((p) => `${p.name} ${p.category} ${p.description} ${p.sizeLabel}`.toLowerCase().includes(term));
    if (filters.category) products = products.filter((p) => String(p.categoryId) === String(filters.category) || p.category.toLowerCase() === String(filters.category).toLowerCase() || p.category.toLowerCase().replaceAll(' ', '-') === String(filters.category).toLowerCase());
    if (filters.size) products = products.filter((p) => filters.size === 'Pack' ? /pack|case/i.test(`${p.name} ${p.sizeLabel}`) : p.sizeLabel.toLowerCase().includes(String(filters.size).toLowerCase()));
    if (filters.minPrice !== undefined && filters.minPrice !== '') products = products.filter((p) => p.effectivePrice >= Number(filters.minPrice));
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') products = products.filter((p) => p.effectivePrice <= Number(filters.maxPrice));
    if (filters.available === 'true') products = products.filter((p) => p.available);
    if (filters.available === 'false') products = products.filter((p) => !p.available);
    if (filters.rating) products = products.filter((p) => p.rating >= Number(filters.rating));
    const sort = filters.sort || 'popular';
    const sorters = {
      'price-asc': (a, b) => a.effectivePrice - b.effectivePrice,
      'price-desc': (a, b) => b.effectivePrice - a.effectivePrice,
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      rated: (a, b) => b.rating - a.rating,
      popular: (a, b) => b.reviewCount - a.reviewCount,
    };
    products.sort(sorters[sort] || sorters.popular);
    return products;
  }
  const clauses = [];
  const params = [];
  if (!filters.includeDisabled) clauses.push('p.enabled = 1');
  if (filters.search) { clauses.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR p.size_label LIKE ?)'); const q = `%${String(filters.search).trim()}%`; params.push(q, q, q, q); }
  if (filters.category) { clauses.push('(c.id = ? OR c.slug = ?)'); params.push(Number.isNaN(Number(filters.category)) ? -1 : Number(filters.category), String(filters.category)); }
  if (filters.size === 'Pack') { clauses.push('(p.size_label LIKE ? OR p.name LIKE ?)'); params.push('%Pack%', '%Pack%'); }
  else if (filters.size) { clauses.push('p.size_label LIKE ?'); params.push(`%${filters.size}%`); }
  if (filters.minPrice !== undefined && filters.minPrice !== '') { clauses.push('COALESCE(p.discount_price, p.price) >= ?'); params.push(Number(filters.minPrice)); }
  if (filters.maxPrice !== undefined && filters.maxPrice !== '') { clauses.push('COALESCE(p.discount_price, p.price) <= ?'); params.push(Number(filters.maxPrice)); }
  if (filters.available === 'true') clauses.push('p.stock > 0');
  if (filters.available === 'false') clauses.push('p.stock = 0');
  if (filters.rating) { clauses.push('p.rating_avg >= ?'); params.push(Number(filters.rating)); }
  const orderBy = ({ 'price-asc': 'COALESCE(p.discount_price,p.price) ASC', 'price-desc': 'COALESCE(p.discount_price,p.price) DESC', newest: 'p.created_at DESC', rated: 'p.rating_avg DESC', popular: 'p.review_count DESC' })[filters.sort || 'popular'] || 'p.review_count DESC';
  const [rows] = await pool.execute(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY ${orderBy}`, params);
  return rows.map(mapProduct);
}
export async function getProduct(idOrSlug, includeDisabled = false) {
  if (!isMysql) {
    const product = state.products.find((p) => String(p.id) === String(idOrSlug) || p.slug === String(idOrSlug));
    return product && (includeDisabled || product.enabled) ? mapProduct({ ...product, categoryName: state.categories.find((c) => c.id === product.categoryId)?.name }) : null;
  }
  const [rows] = await pool.execute(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE (p.id = ? OR p.slug = ?) ${includeDisabled ? '' : 'AND p.enabled=1'} LIMIT 1`, [Number.isNaN(Number(idOrSlug)) ? -1 : Number(idOrSlug), String(idOrSlug)]);
  return mapProduct(rows[0]);
}
export async function createProduct(payload) {
  const categoryId = Number(payload.categoryId);
  const name = String(payload.name || '').trim();
  if (!name || !Number.isSafeInteger(categoryId) || categoryId < 1) throw appError('Product name and category are required.');
  const category = (await getCategories()).find((item) => item.id === categoryId);
  if (!category) throw appError('Choose a valid category.');
  const slug = String(payload.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const price = Number(payload.price);
  const discountPrice = payload.discountPrice === '' || payload.discountPrice == null ? null : Number(payload.discountPrice);
  const stock = Number(payload.stock ?? 0);
  if (!Number.isFinite(price) || price < 0 || price > 1000000 || discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice >= price) || !Number.isSafeInteger(stock) || stock < 0) throw appError('Enter a valid price, stock and optional discount below the regular price.');
  const values = [categoryId, name, slug, String(payload.sizeLabel || '').trim(), String(payload.description || '').trim(), String(payload.imageUrl || '/images/product-500ml.svg').trim(), price, discountPrice, stock, payload.enabled === false || payload.enabled === 'false' ? 0 : 1];
  if (!isMysql) {
    if (state.products.some((p) => p.slug === slug)) throw appError('A product with this name already exists.', 409);
    const product = mapProduct({ id: id('products'), categoryId, categoryName: category.name, name, slug, sizeLabel: values[3], description: values[4], imageUrl: values[5], price: values[6], discountPrice: values[7], stock: values[8], rating: 0, reviewCount: 0, enabled: values[9], createdAt: iso() });
    state.products.push(product);
    return product;
  }
  const [result] = await pool.execute('INSERT INTO products (category_id,name,slug,size_label,description,image_url,price,discount_price,stock,enabled) VALUES (?,?,?,?,?,?,?,?,?,?)', [categoryId, name, slug, values[3], values[4], values[5], values[6], values[7], values[8], values[9]]);
  return getProduct(result.insertId, true);
}
export async function updateProduct(productId, payload) {
  const old = await getProduct(productId, true);
  if (!old) throw appError('Product not found.', 404);
  const merged = { ...old, ...payload };
  const categoryId = Number(merged.categoryId);
  const category = (await getCategories()).find((item) => item.id === categoryId);
  if (!category) throw appError('Choose a valid category.');
  const slug = String(merged.slug || merged.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const price = Number(merged.price);
  const discountPrice = merged.discountPrice === '' || merged.discountPrice == null ? null : Number(merged.discountPrice);
  const stock = Math.max(0, Number(merged.stock) || 0);
  if (!String(merged.name || '').trim() || !Number.isFinite(price) || price < 0 || discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice >= price)) throw appError('Check the product name, price and discount price.');
  const enabled = merged.enabled === false || merged.enabled === 0 || merged.enabled === 'false' ? 0 : 1;
  if (!isMysql) {
    const product = state.products.find((p) => p.id === Number(productId));
    Object.assign(product, { categoryId, categoryName: state.categories.find((c) => c.id === categoryId)?.name || product.categoryName, name: String(merged.name).trim(), slug, sizeLabel: String(merged.sizeLabel || ''), description: String(merged.description || ''), imageUrl: String(merged.imageUrl || product.imageUrl), price, discountPrice, stock, enabled: Boolean(enabled) });
    return mapProduct(product);
  }
  await pool.execute('UPDATE products SET category_id=?,name=?,slug=?,size_label=?,description=?,image_url=?,price=?,discount_price=?,stock=?,enabled=? WHERE id=?', [categoryId, String(merged.name).trim(), slug, String(merged.sizeLabel || ''), String(merged.description || ''), String(merged.imageUrl || old.imageUrl), price, discountPrice, stock, enabled, productId]);
  const [rows] = await pool.execute('SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?', [productId]);
  return mapProduct(rows[0]);
}
export async function deleteProduct(productId) {
  if (!isMysql) {
    const product = state.products.find((p) => p.id === Number(productId));
    if (!product) throw appError('Product not found.', 404);
    product.enabled = false;
    return { success: true };
  }
  const [result] = await pool.execute('UPDATE products SET enabled=0 WHERE id=?', [productId]);
  if (!result.affectedRows) throw appError('Product not found.', 404);
  return { success: true };
}
export async function updateInventory(productId, stock) {
  const quantity = Number(stock);
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw appError('Stock must be zero or a positive whole number.');
  if (!isMysql) {
    const product = state.products.find((p) => p.id === Number(productId));
    if (!product) throw appError('Product not found.', 404);
    product.stock = quantity;
    return mapProduct(product);
  }
  await pool.execute('UPDATE products SET stock=? WHERE id=?', [quantity, productId]);
  const [rows] = await pool.execute('SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?', [productId]);
  if (!rows[0]) throw appError('Product not found.', 404);
  return mapProduct(rows[0]);
}

export async function findUserByEmail(email) {
  const key = normalizeEmail(email);
  if (!isMysql) return clone(state.users.find((u) => normalizeEmail(u.email) === key) || null);
  const [rows] = await pool.execute('SELECT * FROM users WHERE email=? LIMIT 1', [key]);
  return mapUser(rows[0]);
}
export async function findUserById(userId) {
  if (!isMysql) return clone(state.users.find((u) => u.id === Number(userId)) || null);
  const [rows] = await pool.execute('SELECT * FROM users WHERE id=? LIMIT 1', [userId]);
  return mapUser(rows[0]);
}
export async function createUser({ name, email, phone, passwordHash }) {
  const cleanEmail = normalizeEmail(email);
  if (!isMysql) {
    if (state.users.some((u) => normalizeEmail(u.email) === cleanEmail)) throw appError('An account with that email already exists.', 409);
    const user = { id: id('users'), name: String(name).trim(), email: cleanEmail, phone: String(phone).trim(), passwordHash, createdAt: iso() };
    state.users.push(user);
    return clone(user);
  }
  try {
    const [result] = await pool.execute('INSERT INTO users (name,email,phone,password_hash) VALUES (?,?,?,?)', [String(name).trim(), cleanEmail, String(phone).trim(), passwordHash]);
    return findUserById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw appError('An account with that email already exists.', 409);
    throw error;
  }
}
export async function updateUser(userId, fields) {
  const name = String(fields.name || '').trim();
  const phone = String(fields.phone || '').trim();
  if (!name || !phone) throw appError('Name and phone are required.');
  if (!isMysql) {
    const user = state.users.find((u) => u.id === Number(userId));
    if (!user) throw appError('Account not found.', 404);
    Object.assign(user, { name, phone });
    return clone(user);
  }
  await pool.execute('UPDATE users SET name=?,phone=? WHERE id=?', [name, phone, userId]);
  return findUserById(userId);
}
export async function findAdminByEmail(email) {
  const key = normalizeEmail(email);
  if (!isMysql) return clone(state.admins.find((a) => normalizeEmail(a.email) === key) || null);
  const [rows] = await pool.execute('SELECT * FROM admins WHERE email=? LIMIT 1', [key]);
  const row = rows[0];
  return row ? { id: Number(row.id), name: row.name, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at } : null;
}
export async function findAdminById(adminId) {
  if (!isMysql) return clone(state.admins.find((a) => a.id === Number(adminId)) || null);
  const [rows] = await pool.execute('SELECT id,name,email,created_at FROM admins WHERE id=? LIMIT 1', [adminId]);
  return rows[0] ? { id: Number(rows[0].id), name: rows[0].name, email: rows[0].email, createdAt: rows[0].created_at } : null;
}
export async function setPasswordReset(email, tokenHash, expiresAt) {
  const user = await findUserByEmail(email);
  if (!user) return false;
  if (!isMysql) {
    const record = state.users.find((u) => u.id === user.id);
    record.resetTokenHash = tokenHash;
    record.resetExpires = expiresAt;
    return true;
  }
  await pool.execute('UPDATE users SET reset_token_hash=?,reset_expires=? WHERE id=?', [tokenHash, expiresAt, user.id]);
  return true;
}
export async function findUserByResetHash(tokenHash) {
  if (!isMysql) return clone(state.users.find((u) => u.resetTokenHash === tokenHash && new Date(u.resetExpires) > new Date()) || null);
  const [rows] = await pool.execute('SELECT * FROM users WHERE reset_token_hash=? AND reset_expires > NOW() LIMIT 1', [tokenHash]);
  return mapUser(rows[0]);
}
export async function saveResetPassword(userId, passwordHash) {
  if (!isMysql) {
    const user = state.users.find((u) => u.id === Number(userId));
    if (!user) throw appError('Reset request is invalid or expired.', 400);
    user.passwordHash = passwordHash;
    delete user.resetTokenHash; delete user.resetExpires;
    return;
  }
  await pool.execute('UPDATE users SET password_hash=?,reset_token_hash=NULL,reset_expires=NULL WHERE id=?', [passwordHash, userId]);
}

export async function listAddresses(userId) {
  if (!isMysql) return clone(state.addresses.filter((a) => a.userId === Number(userId)).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)));
  const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,created_at DESC', [userId]);
  return rows.map(mapAddress);
}
export async function saveAddress(userId, payload, addressId = null) {
  const fields = {
    fullName: String(payload.fullName || '').trim().slice(0, 120), phone: String(payload.phone || '').trim().slice(0, 30), addressLine: String(payload.addressLine || '').trim().slice(0, 255),
    city: String(payload.city || '').trim().slice(0, 100), state: String(payload.state || '').trim().slice(0, 100), pincode: String(payload.pincode || '').trim().slice(0, 12),
    isDefault: payload.isDefault === true || payload.isDefault === 1 || payload.isDefault === '1' || payload.isDefault === 'true',
  };
  if (fields.fullName.length < 2 || fields.addressLine.length < 5 || !fields.city || !fields.state || !validPhone(fields.phone)) throw appError('Please enter a valid name, phone number and complete delivery address.');
  if (!/^\d{5,6}$/.test(fields.pincode)) throw appError('Enter a valid postal code.');
  if (!isMysql) {
    if (addressId) {
      const record = state.addresses.find((a) => a.id === Number(addressId) && a.userId === Number(userId));
      if (!record) throw appError('Address not found.', 404);
      Object.assign(record, fields);
      if (fields.isDefault) state.addresses.forEach((a) => { if (a.userId === Number(userId) && a.id !== record.id) a.isDefault = false; });
      if (!state.addresses.some((a) => a.userId === Number(userId) && a.isDefault)) record.isDefault = true;
      return clone(record);
    }
    const first = !state.addresses.some((a) => a.userId === Number(userId));
    const record = { id: id('addresses'), userId: Number(userId), ...fields, isDefault: fields.isDefault || first, createdAt: iso() };
    if (record.isDefault) state.addresses.forEach((a) => { if (a.userId === Number(userId)) a.isDefault = false; });
    state.addresses.push(record);
    return clone(record);
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[countRow]] = await conn.execute('SELECT COUNT(*) AS total FROM addresses WHERE user_id=?', [userId]);
    if (addressId) {
      const [existingRows] = await conn.execute('SELECT id FROM addresses WHERE id=? AND user_id=? FOR UPDATE', [addressId, userId]);
      if (!existingRows[0]) throw appError('Address not found.', 404);
      const [otherDefaults] = await conn.execute('SELECT id FROM addresses WHERE user_id=? AND id<>? AND is_default=1 LIMIT 1', [userId, addressId]);
      const makeDefault = fields.isDefault || !otherDefaults.length;
      if (makeDefault) await conn.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [userId]);
      await conn.execute('UPDATE addresses SET full_name=?,phone=?,address_line=?,city=?,state=?,pincode=?,is_default=? WHERE id=? AND user_id=?', [fields.fullName, fields.phone, fields.addressLine, fields.city, fields.state, fields.pincode, makeDefault ? 1 : 0, addressId, userId]);
    } else {
      const makeDefault = fields.isDefault || Number(countRow.total) === 0;
      if (makeDefault) await conn.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [userId]);
      await conn.execute('INSERT INTO addresses (user_id,full_name,phone,address_line,city,state,pincode,is_default) VALUES (?,?,?,?,?,?,?,?)', [userId, fields.fullName, fields.phone, fields.addressLine, fields.city, fields.state, fields.pincode, makeDefault ? 1 : 0]);
    }
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  const rows = await listAddresses(userId);
  return addressId ? rows.find((a) => a.id === Number(addressId)) : rows[0];
}
export async function deleteAddress(userId, addressId) {
  if (!isMysql) {
    const index = state.addresses.findIndex((a) => a.id === Number(addressId) && a.userId === Number(userId));
    if (index < 0) throw appError('Address not found.', 404);
    const wasDefault = state.addresses[index].isDefault;
    state.addresses.splice(index, 1);
    if (wasDefault) { const next = state.addresses.find((a) => a.userId === Number(userId)); if (next) next.isDefault = true; }
    return { success: true };
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [addressRows] = await conn.execute('SELECT id,is_default FROM addresses WHERE id=? AND user_id=? FOR UPDATE', [addressId, userId]);
    if (!addressRows[0]) throw appError('Address not found.', 404);
    await conn.execute('DELETE FROM addresses WHERE id=? AND user_id=?', [addressId, userId]);
    if (toBool(addressRows[0].is_default)) {
      const [[nextAddress]] = await conn.execute('SELECT id FROM addresses WHERE user_id=? ORDER BY created_at LIMIT 1', [userId]);
      if (nextAddress) {
        await conn.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [userId]);
        await conn.execute('UPDATE addresses SET is_default=1 WHERE id=?', [nextAddress.id]);
      }
    }
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  return { success: true };
}

async function ensureCartId(userId, conn = pool) {
  const [rows] = await conn.execute('SELECT id FROM carts WHERE user_id=? LIMIT 1', [userId]);
  if (rows[0]) return Number(rows[0].id);
  const [result] = await conn.execute('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return Number(result.insertId);
}
export async function getCart(userId) {
  if (!isMysql) return state.cartItems.filter((item) => item.userId === Number(userId)).map((item) => ({ id: item.id, quantity: item.quantity, product: mapProduct(state.products.find((p) => p.id === item.productId)) })).filter((item) => item.product?.enabled);
  const [rows] = await pool.execute('SELECT ci.id,ci.quantity,p.*,c.name AS category_name FROM carts ca JOIN cart_items ci ON ci.cart_id=ca.id JOIN products p ON p.id=ci.product_id LEFT JOIN categories c ON c.id=p.category_id WHERE ca.user_id=? AND p.enabled=1 ORDER BY ci.id DESC', [userId]);
  return rows.map((row) => ({ id: Number(row.id), quantity: Number(row.quantity), product: mapProduct(row) }));
}
export async function addCartItem(userId, productId, quantity = 1) {
  const qty = Number(quantity);
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99) throw appError('Choose a quantity between 1 and 99.');
  const product = await getProduct(productId);
  if (!product) throw appError('Product is no longer available.', 404);
  if (product.stock < qty) throw appError(`Only ${product.stock} units are currently available.`, 409);
  if (!isMysql) {
    const item = state.cartItems.find((i) => i.userId === Number(userId) && i.productId === Number(productId));
    if (item) {
      if (item.quantity + qty > product.stock) throw appError(`Only ${product.stock} units are currently available.`, 409);
      item.quantity += qty;
      return (await getCart(userId)).find((row) => row.product.id === Number(productId));
    }
    const created = { id: id('cartItems'), userId: Number(userId), productId: Number(productId), quantity: qty };
    state.cartItems.push(created);
    return { id: created.id, quantity: qty, product };
  }
  const cartId = await ensureCartId(userId);
  const [rows] = await pool.execute('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=? LIMIT 1', [cartId, productId]);
  if (rows[0]) {
    if (Number(rows[0].quantity) + qty > product.stock) throw appError(`Only ${product.stock} units are currently available.`, 409);
    await pool.execute('UPDATE cart_items SET quantity=quantity+? WHERE id=?', [qty, rows[0].id]);
  } else {
    await pool.execute('INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)', [cartId, productId, qty]);
  }
  return (await getCart(userId)).find((row) => row.product.id === Number(productId));
}
export async function updateCartItem(userId, itemId, quantity) {
  const qty = Number(quantity);
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99) throw appError('Choose a quantity between 1 and 99.');
  if (!isMysql) {
    const item = state.cartItems.find((i) => i.id === Number(itemId) && i.userId === Number(userId));
    if (!item) throw appError('Cart item not found.', 404);
    const product = await getProduct(item.productId);
    if (!product || qty > product.stock) throw appError(`Only ${product?.stock || 0} units are currently available.`, 409);
    item.quantity = qty;
    return getCart(userId);
  }
  const [rows] = await pool.execute('SELECT ci.id,p.stock FROM cart_items ci JOIN carts c ON c.id=ci.cart_id JOIN products p ON p.id=ci.product_id WHERE ci.id=? AND c.user_id=? LIMIT 1', [itemId, userId]);
  if (!rows[0]) throw appError('Cart item not found.', 404);
  if (qty > Number(rows[0].stock)) throw appError(`Only ${rows[0].stock} units are currently available.`, 409);
  await pool.execute('UPDATE cart_items SET quantity=? WHERE id=?', [qty, itemId]);
  return getCart(userId);
}
export async function removeCartItem(userId, itemId) {
  if (!isMysql) {
    const index = state.cartItems.findIndex((i) => i.id === Number(itemId) && i.userId === Number(userId));
    if (index < 0) throw appError('Cart item not found.', 404);
    state.cartItems.splice(index, 1);
    return { success: true };
  }
  const [result] = await pool.execute('DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE ci.id=? AND c.user_id=?', [itemId, userId]);
  if (!result.affectedRows) throw appError('Cart item not found.', 404);
  return { success: true };
}
export async function clearCart(userId) {
  if (!isMysql) { state.cartItems = state.cartItems.filter((i) => i.userId !== Number(userId)); return { success: true }; }
  await pool.execute('DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE c.user_id=?', [userId]);
  return { success: true };
}
export async function getWishlist(userId) {
  if (!isMysql) return state.wishlistItems.filter((i) => i.userId === Number(userId)).map((i) => mapProduct(state.products.find((p) => p.id === i.productId))).filter((product) => product?.enabled);
  const [rows] = await pool.execute('SELECT p.*,c.name AS category_name FROM wishlists w JOIN wishlist_items wi ON wi.wishlist_id=w.id JOIN products p ON p.id=wi.product_id LEFT JOIN categories c ON c.id=p.category_id WHERE w.user_id=? AND p.enabled=1 ORDER BY wi.id DESC', [userId]);
  return rows.map(mapProduct);
}
export async function addWishlistItem(userId, productId) {
  const product = await getProduct(productId);
  if (!product) throw appError('Product is no longer available.', 404);
  if (!isMysql) {
    if (!state.wishlistItems.some((i) => i.userId === Number(userId) && i.productId === Number(productId))) state.wishlistItems.push({ id: id('wishlistItems'), userId: Number(userId), productId: Number(productId) });
    return getWishlist(userId);
  }
  const [rows] = await pool.execute('SELECT id FROM wishlists WHERE user_id=? LIMIT 1', [userId]);
  let wishlistId = rows[0]?.id;
  if (!wishlistId) { const [created] = await pool.execute('INSERT INTO wishlists (user_id) VALUES (?)', [userId]); wishlistId = created.insertId; }
  await pool.execute('INSERT IGNORE INTO wishlist_items (wishlist_id,product_id) VALUES (?,?)', [wishlistId, productId]);
  return getWishlist(userId);
}
export async function removeWishlistItem(userId, productId) {
  if (!isMysql) { state.wishlistItems = state.wishlistItems.filter((i) => !(i.userId === Number(userId) && i.productId === Number(productId))); return getWishlist(userId); }
  await pool.execute('DELETE wi FROM wishlist_items wi JOIN wishlists w ON w.id=wi.wishlist_id WHERE w.user_id=? AND wi.product_id=?', [userId, productId]);
  return getWishlist(userId);
}

function getPromotionFromState(code) {
  const found = state.promotions.find((p) => p.code.toUpperCase() === String(code || '').toUpperCase() && p.active);
  if (!found || new Date(found.startsAt) > new Date() || new Date(found.endsAt) < new Date()) return null;
  return found;
}
function priceBreakdown(items, promo = null, settings = {}) {
  const subtotal = round2(items.reduce((sum, item) => sum + Number(item.product.price) * Number(item.quantity), 0));
  const productDiscount = round2(items.reduce((sum, item) => sum + Math.max(0, Number(item.product.price) - Number(item.product.effectivePrice)) * Number(item.quantity), 0));
  const discountedSubtotal = round2(subtotal - productDiscount);
  let couponDiscount = 0;
  if (promo && discountedSubtotal >= Number(promo.minOrder || 0)) {
    couponDiscount = promo.discountType === 'percent' ? discountedSubtotal * Number(promo.discountValue) / 100 : Number(promo.discountValue);
    couponDiscount = round2(Math.min(couponDiscount, discountedSubtotal));
  }
  const discount = round2(productDiscount + couponDiscount);
  const taxable = round2(Math.max(0, discountedSubtotal - couponDiscount));
  const freeDeliveryThreshold = Number(settings.freeDeliveryThreshold ?? 299);
  const deliveryFee = Number(settings.deliveryFee ?? 25);
  const deliveryCharge = taxable >= freeDeliveryThreshold ? 0 : deliveryFee;
  const tax = round2(taxable * 0.05);
  return { subtotal, discount, deliveryCharge, tax, total: round2(taxable + deliveryCharge + tax), couponDiscount };
}
async function fetchActivePromotion(code, conn = pool) {
  if (!code) return null;
  if (!isMysql) return getPromotionFromState(code);
  const [rows] = await conn.execute('SELECT * FROM promotions WHERE UPPER(code)=UPPER(?) AND is_active=1 AND starts_at<=NOW() AND ends_at>=NOW() LIMIT 1', [String(code).trim()]);
  const row = rows[0];
  return row ? { id: Number(row.id), code: row.code, discountType: row.discount_type, discountValue: Number(row.discount_value), minOrder: Number(row.min_order), active: true } : null;
}
export async function createPaymentIntent(userId, addressId, promoCode = '', paymentMethod = 'MOCK') {
  if (String(paymentMethod || 'MOCK').toUpperCase() !== 'MOCK') throw appError('Only the safe mock payment method is available in this project.');
  const orderNumber = makeOrderNumber();
  const paymentReference = `MOCK-${randomBytes(8).toString('hex').toUpperCase()}`;
  const expectedDelivery = new Date(Date.now() + 2 * 86400000).toISOString();
  if (!isMysql) {
    const address = state.addresses.find((a) => a.id === Number(addressId) && a.userId === Number(userId));
    if (!address) throw appError('Choose a saved delivery address before continuing.');
    const items = await getCart(userId);
    if (!items.length) throw appError('Your cart is empty. Add something before checkout.');
    for (const item of items) if (item.quantity > item.product.stock) throw appError(`${item.product.name} no longer has enough stock. Please update your cart.`, 409);
    const promo = await fetchActivePromotion(promoCode);
    if (promoCode && !promo) throw appError('That promotion code is invalid or expired.');
    const totals = priceBreakdown(items, promo, await getSettings());
    const orderId = id('orders');
    const order = { id: orderId, orderNumber, userId: Number(userId), status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentMethod: String(paymentMethod || 'MOCK'), ...totals, address: { ...address }, expectedDelivery, createdAt: iso(), items: items.map(orderItemSnapshot), paymentReference };
    state.orders.unshift(order);
    return { orderId, orderNumber, amount: totals.total, currency: 'INR', paymentId: paymentReference, mode: 'mock' };
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [cartRows] = await conn.execute('SELECT ci.id,ci.quantity,p.*,c.name AS category_name FROM carts ca JOIN cart_items ci ON ci.cart_id=ca.id JOIN products p ON p.id=ci.product_id LEFT JOIN categories c ON c.id=p.category_id WHERE ca.user_id=? AND p.enabled=1 FOR UPDATE', [userId]);
    const items = cartRows.map((row) => ({ id: Number(row.id), quantity: Number(row.quantity), product: mapProduct(row) }));
    if (!items.length) throw appError('Your cart is empty. Add something before checkout.');
    for (const item of items) if (item.quantity > item.product.stock) throw appError(`${item.product.name} no longer has enough stock. Please update your cart.`, 409);
    const [addressRows] = await conn.execute('SELECT * FROM addresses WHERE id=? AND user_id=? LIMIT 1', [addressId, userId]);
    if (!addressRows[0]) throw appError('Choose a saved delivery address before continuing.');
    const promo = await fetchActivePromotion(promoCode, conn);
    if (promoCode && !promo) throw appError('That promotion code is invalid or expired.');
    const totals = priceBreakdown(items, promo, await getSettings());
    const address = mapAddress(addressRows[0]);
    const [result] = await conn.execute('INSERT INTO orders (order_number,user_id,status,payment_status,payment_method,subtotal,discount,delivery_charge,tax,total,address_snapshot,expected_delivery) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [orderNumber, userId, 'PENDING_PAYMENT', 'PENDING', String(paymentMethod || 'MOCK'), totals.subtotal, totals.discount, totals.deliveryCharge, totals.tax, totals.total, JSON.stringify(address), expectedDelivery.slice(0, 19).replace('T', ' ')]);
    const orderId = Number(result.insertId);
    for (const item of items) {
      const snapshot = orderItemSnapshot(item);
      await conn.execute('INSERT INTO order_items (order_id,product_id,product_name,size_label,image_url,unit_price,list_price,quantity) VALUES (?,?,?,?,?,?,?,?)', [orderId, snapshot.productId, snapshot.name, snapshot.sizeLabel, snapshot.imageUrl, snapshot.unitPrice, snapshot.listPrice, snapshot.quantity]);
    }
    await conn.execute('INSERT INTO payments (order_id,provider,transaction_id,amount,status,metadata) VALUES (?,?,?,?,?,?)', [orderId, 'MOCK', paymentReference, totals.total, 'PENDING', JSON.stringify({ promoCode: promo?.code || null, demonstration: true })]);
    await conn.commit();
    return { orderId, orderNumber, amount: totals.total, currency: 'INR', paymentId: paymentReference, mode: 'mock' };
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}
export async function getOrder(orderId, userId = null) {
  if (!isMysql) {
    const order = state.orders.find((o) => o.id === Number(orderId) || o.orderNumber === String(orderId));
    if (!order || userId !== null && order.userId !== Number(userId)) return null;
    const customer = state.users.find((u) => u.id === order.userId);
    return mapOrder({ ...order, customerName: customer?.name, customerEmail: customer?.email }, clone(order.items));
  }
  const where = Number.isNaN(Number(orderId)) ? 'o.order_number=?' : 'o.id=?';
  const params = [orderId];
  const owner = userId === null ? '' : ' AND o.user_id=?';
  if (userId !== null) params.push(userId);
  const [rows] = await pool.execute(`SELECT o.*,u.name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id WHERE ${where}${owner} LIMIT 1`, params);
  if (!rows[0]) return null;
  const [itemRows] = await pool.execute('SELECT * FROM order_items WHERE order_id=? ORDER BY id', [rows[0].id]);
  return mapOrder(rows[0], normalizeOrderItems(itemRows));
}
export async function getOrdersForUser(userId) {
  if (!isMysql) return state.orders.filter((o) => o.userId === Number(userId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((o) => mapOrder(o, clone(o.items)));
  const [rows] = await pool.execute('SELECT o.*,u.name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.user_id=? ORDER BY o.created_at DESC', [userId]);
  const result = [];
  for (const row of rows) {
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id=?', [row.id]);
    result.push(mapOrder(row, normalizeOrderItems(items)));
  }
  return result;
}
export async function verifyPayment(orderId, userId, outcome = 'success') {
  if (!isMysql) {
    const order = state.orders.find((o) => o.id === Number(orderId) && o.userId === Number(userId));
    if (!order) throw appError('Payment session not found.', 404);
    if (order.paymentStatus !== 'PENDING') throw appError('This payment has already been processed.', 409);
    if (outcome === 'failed') {
      order.paymentStatus = 'FAILED'; order.status = 'CANCELLED';
      return mapOrder(order, clone(order.items));
    }
    for (const item of order.items) {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) throw appError(`${item.name} is no longer available in the requested quantity.`, 409);
    }
    for (const item of order.items) state.products.find((p) => p.id === item.productId).stock -= item.quantity;
    order.paymentStatus = 'PAID'; order.status = 'PLACED';
    state.cartItems = state.cartItems.filter((item) => item.userId !== Number(userId));
    return mapOrder(order, clone(order.items));
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM orders WHERE id=? AND user_id=? FOR UPDATE', [orderId, userId]);
    const order = rows[0];
    if (!order) throw appError('Payment session not found.', 404);
    if (order.payment_status !== 'PENDING') throw appError('This payment has already been processed.', 409);
    if (outcome === 'failed') {
      await conn.execute('UPDATE payments SET status=? WHERE order_id=?', ['FAILED', orderId]);
      await conn.execute('UPDATE orders SET payment_status=?,status=? WHERE id=?', ['FAILED', 'CANCELLED', orderId]);
    } else {
      const [items] = await conn.execute('SELECT product_id,quantity FROM order_items WHERE order_id=? FOR UPDATE', [orderId]);
      for (const item of items) {
        const [result] = await conn.execute('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?', [item.quantity, item.product_id, item.quantity]);
        if (!result.affectedRows) throw appError('A product in this order has sold out. Please contact support.', 409);
      }
      await conn.execute('UPDATE payments SET status=? WHERE order_id=?', ['PAID', orderId]);
      await conn.execute('UPDATE orders SET payment_status=?,status=? WHERE id=?', ['PAID', 'PLACED', orderId]);
      await conn.execute('DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE c.user_id=?', [userId]);
    }
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  return getOrder(orderId, userId);
}
export async function getAdminOrders(filters = {}) {
  if (!isMysql) {
    const query = String(filters.search || '').toLowerCase();
    return state.orders.filter((o) => (!filters.status || filters.status === 'ALL' || o.status === filters.status) && (!query || `${o.orderNumber} ${state.users.find((u) => u.id === o.userId)?.name || ''} ${state.users.find((u) => u.id === o.userId)?.email || ''}`.toLowerCase().includes(query))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((o) => {
      const user = state.users.find((u) => u.id === o.userId);
      return mapOrder({ ...o, customerName: user?.name, customerEmail: user?.email }, clone(o.items));
    });
  }
  const clauses = []; const params = [];
  if (filters.status && filters.status !== 'ALL') { clauses.push('o.status=?'); params.push(filters.status); }
  if (filters.search) { clauses.push('(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'); const q = `%${filters.search}%`; params.push(q, q, q); }
  const [rows] = await pool.execute(`SELECT o.*,u.name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY o.created_at DESC`, params);
  return Promise.all(rows.map(async (row) => {
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id=?', [row.id]);
    return mapOrder(row, normalizeOrderItems(items));
  }));
}
export async function updateOrderStatus(orderId, status) {
  const allowed = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) throw appError('Choose a valid order status.');
  if (!isMysql) {
    const order = state.orders.find((o) => o.id === Number(orderId));
    if (!order) throw appError('Order not found.', 404);
    if (status === 'CANCELLED' && order.status !== 'CANCELLED' && order.paymentStatus === 'PAID') {
      for (const item of order.items) { const product = state.products.find((p) => p.id === item.productId); if (product) product.stock += item.quantity; }
    }
    order.status = status;
    if (status === 'CANCELLED' && order.paymentStatus === 'PENDING') order.paymentStatus = 'FAILED';
    return mapOrder(order, clone(order.items));
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM orders WHERE id=? FOR UPDATE', [orderId]);
    const order = rows[0];
    if (!order) throw appError('Order not found.', 404);
    if (status === 'CANCELLED' && order.status !== 'CANCELLED' && order.payment_status === 'PAID') {
      const [items] = await conn.execute('SELECT product_id,quantity FROM order_items WHERE order_id=?', [orderId]);
      for (const item of items) await conn.execute('UPDATE products SET stock=stock+? WHERE id=?', [item.quantity, item.product_id]);
    }
    await conn.execute('UPDATE orders SET status=? WHERE id=?', [status, orderId]);
    if (status === 'CANCELLED' && order.payment_status === 'PENDING') {
      await conn.execute('UPDATE orders SET payment_status=? WHERE id=?', ['FAILED', orderId]);
      await conn.execute('UPDATE payments SET status=? WHERE order_id=?', ['FAILED', orderId]);
    }
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  return getOrder(orderId);
}
export async function updateOrderPaymentStatus(orderId, paymentStatus) {
  if (!['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) throw appError('Choose a valid payment status.');
  if (!isMysql) {
    const order = state.orders.find((o) => o.id === Number(orderId));
    if (!order) throw appError('Order not found.', 404);
    order.paymentStatus = paymentStatus;
    return mapOrder(order, clone(order.items));
  }
  await pool.execute('UPDATE orders SET payment_status=? WHERE id=?', [paymentStatus, orderId]);
  await pool.execute('UPDATE payments SET status=? WHERE order_id=?', [paymentStatus, orderId]);
  return getOrder(orderId);
}
export async function listInventory() { return getProducts({ includeDisabled: true, sort: 'popular' }); }
export async function getCustomerList() {
  if (!isMysql) return state.users.map((u) => {
    const orders = state.orders.filter((o) => o.userId === u.id && o.paymentStatus === 'PAID');
    return { id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt, orderCount: state.orders.filter((o) => o.userId === u.id).length, totalSpent: round2(orders.reduce((sum, o) => sum + o.total, 0)) };
  });
  const [rows] = await pool.execute('SELECT u.id,u.name,u.email,u.phone,u.created_at,COUNT(DISTINCT o.id) AS order_count,COALESCE(SUM(CASE WHEN o.payment_status="PAID" THEN o.total ELSE 0 END),0) AS total_spent FROM users u LEFT JOIN orders o ON o.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC');
  return rows.map((r) => ({ id: Number(r.id), name: r.name, email: r.email, phone: r.phone, createdAt: r.created_at, orderCount: Number(r.order_count), totalSpent: Number(r.total_spent) }));
}

function reviewView(review, user, product) {
  return {
    id: Number(review.id), userId: Number(review.userId ?? review.user_id), productId: Number(review.productId ?? review.product_id),
    customerName: user?.name || review.customerName || 'Pure Aqua customer', productName: product?.name || review.productName,
    productImage: product?.imageUrl || review.productImage, rating: Number(review.rating), title: review.title || '', body: review.body || review.review || '',
    status: review.status || 'PENDING', createdAt: review.createdAt ?? review.created_at,
  };
}
function refreshDemoProductRating(productId) {
  const product = state.products.find((p) => p.id === Number(productId));
  if (!product) return;
  const approved = state.reviews.filter((r) => r.productId === Number(productId) && r.status === 'APPROVED');
  product.reviewCount = approved.length || (product.id <= 5 ? product.reviewCount : 0);
  if (approved.length) product.rating = round2(approved.reduce((sum, item) => sum + item.rating, 0) / approved.length);
}
export async function listReviews({ includeAll = false, productId = null } = {}) {
  if (!isMysql) {
    return state.reviews.filter((r) => (includeAll || r.status === 'APPROVED') && (!productId || r.productId === Number(productId))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((r) => reviewView(r, state.users.find((u) => u.id === r.userId), state.products.find((p) => p.id === r.productId)));
  }
  const clauses = [];
  const params = [];
  if (!includeAll) clauses.push('r.status="APPROVED"');
  if (productId) { clauses.push('r.product_id=?'); params.push(productId); }
  const [rows] = await pool.execute(`SELECT r.*,u.name AS customer_name,p.name AS product_name,p.image_url AS product_image FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY r.created_at DESC`, params);
  return rows.map((r) => reviewView(r, { name: r.customer_name }, { name: r.product_name, imageUrl: r.product_image }));
}
export async function createReview(userId, payload) {
  const productId = Number(payload.productId);
  const rating = Number(payload.rating);
  const title = String(payload.title || '').trim().slice(0, 100);
  const body = String(payload.body || '').trim().slice(0, 1200);
  if (!Number.isSafeInteger(productId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || !body) throw appError('Choose a 1–5 star rating and add your review.');
  const product = await getProduct(productId);
  if (!product) throw appError('Product not found.', 404);
  if (!isMysql) {
    if (state.reviews.some((r) => r.userId === Number(userId) && r.productId === productId)) throw appError('You have already reviewed this product.', 409);
    const review = { id: id('reviews'), userId: Number(userId), productId, rating, title, body, status: 'PENDING', createdAt: iso() };
    state.reviews.unshift(review);
    return reviewView(review, state.users.find((u) => u.id === Number(userId)), product);
  }
  try {
    const [result] = await pool.execute('INSERT INTO reviews (user_id,product_id,rating,title,body,status) VALUES (?,?,?,?,?,?)', [userId, productId, rating, title, body, 'PENDING']);
    const [rows] = await pool.execute('SELECT r.*,u.name AS customer_name,p.name AS product_name,p.image_url AS product_image FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id WHERE r.id=?', [result.insertId]);
    return reviewView(rows[0], { name: rows[0].customer_name }, { name: rows[0].product_name, imageUrl: rows[0].product_image });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw appError('You have already reviewed this product.', 409);
    throw error;
  }
}
export async function moderateReview(reviewId, status) {
  if (!['APPROVED', 'PENDING', 'REJECTED'].includes(status)) throw appError('Choose a valid review status.');
  if (!isMysql) {
    const review = state.reviews.find((r) => r.id === Number(reviewId));
    if (!review) throw appError('Review not found.', 404);
    review.status = status;
    refreshDemoProductRating(review.productId);
    return reviewView(review, state.users.find((u) => u.id === review.userId), state.products.find((p) => p.id === review.productId));
  }
  const [result] = await pool.execute('UPDATE reviews SET status=? WHERE id=?', [status, reviewId]);
  if (!result.affectedRows) throw appError('Review not found.', 404);
  const [[review]] = await pool.execute('SELECT product_id FROM reviews WHERE id=?', [reviewId]);
  await pool.execute('UPDATE products p SET p.rating_avg=COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id=p.id AND r.status="APPROVED"),0),p.review_count=(SELECT COUNT(*) FROM reviews r WHERE r.product_id=p.id AND r.status="APPROVED") WHERE p.id=?', [review.product_id]);
  return (await listReviews({ includeAll: true })).find((item) => item.id === Number(reviewId));
}
export async function deleteReview(reviewId) {
  if (!isMysql) {
    const index = state.reviews.findIndex((r) => r.id === Number(reviewId));
    if (index < 0) throw appError('Review not found.', 404);
    const productId = state.reviews[index].productId;
    state.reviews.splice(index, 1);
    refreshDemoProductRating(productId);
    return { success: true };
  }
  const [[review]] = await pool.execute('SELECT product_id FROM reviews WHERE id=?', [reviewId]);
  if (!review) throw appError('Review not found.', 404);
  await pool.execute('DELETE FROM reviews WHERE id=?', [reviewId]);
  await pool.execute('UPDATE products p SET p.rating_avg=COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id=p.id AND r.status="APPROVED"),0),p.review_count=(SELECT COUNT(*) FROM reviews r WHERE r.product_id=p.id AND r.status="APPROVED") WHERE p.id=?', [review.product_id]);
  return { success: true };
}
export async function createContactMessage(payload) {
  const message = {
    name: String(payload.name || '').trim().slice(0, 120), email: String(payload.email || '').trim().toLowerCase().slice(0, 180),
    phone: String(payload.phone || '').trim().slice(0, 30), subject: String(payload.subject || '').trim().slice(0, 180),
    message: String(payload.message || '').trim().slice(0, 3000), status: 'NEW',
  };
  if (!message.name || !message.email || !message.subject || message.message.length < 10) throw appError('Please complete every field and write a message of at least 10 characters.');
  if (!isMysql) {
    const saved = { id: id('messages'), ...message, createdAt: iso() };
    state.messages.unshift(saved);
    return { success: true, id: saved.id };
  }
  const [result] = await pool.execute('INSERT INTO contact_messages (name,email,phone,subject,message,status) VALUES (?,?,?,?,?,?)', [message.name, message.email, message.phone, message.subject, message.message, 'NEW']);
  return { success: true, id: result.insertId };
}
export async function listContactMessages(status = '') {
  if (!isMysql) return clone(state.messages.filter((m) => !status || status === 'ALL' || m.status === status).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  const [rows] = await pool.execute(`SELECT * FROM contact_messages ${status && status !== 'ALL' ? 'WHERE status=?' : ''} ORDER BY created_at DESC`, status && status !== 'ALL' ? [status] : []);
  return rows.map((r) => ({ id: Number(r.id), name: r.name, email: r.email, phone: r.phone, subject: r.subject, message: r.message, status: r.status, createdAt: r.created_at }));
}
export async function updateContactMessage(messageId, status) {
  if (!['NEW', 'READ', 'RESOLVED'].includes(status)) throw appError('Choose a valid message status.');
  if (!isMysql) {
    const message = state.messages.find((m) => m.id === Number(messageId));
    if (!message) throw appError('Message not found.', 404);
    message.status = status;
    return clone(message);
  }
  const [result] = await pool.execute('UPDATE contact_messages SET status=? WHERE id=?', [status, messageId]);
  if (!result.affectedRows) throw appError('Message not found.', 404);
  return (await listContactMessages()).find((m) => m.id === Number(messageId));
}

function normalizePromotion(row) {
  return { id: Number(row.id), code: row.code, title: row.title, description: row.description || '', discountType: row.discountType ?? row.discount_type, discountValue: Number(row.discountValue ?? row.discount_value), minOrder: Number(row.minOrder ?? row.min_order), startsAt: row.startsAt ?? row.starts_at, endsAt: row.endsAt ?? row.ends_at, active: toBool(row.active ?? row.is_active), badge: row.badge || 'OFFER' };
}
export async function listPromotions(activeOnly = false) {
  if (!isMysql) return clone(state.promotions.filter((p) => !activeOnly || p.active).sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt)));
  const [rows] = await pool.execute(`SELECT * FROM promotions ${activeOnly ? 'WHERE is_active=1 AND starts_at<=NOW() AND ends_at>=NOW()' : ''} ORDER BY starts_at DESC`);
  return rows.map(normalizePromotion);
}
export async function savePromotion(payload, promotionId = null) {
  const promotion = {
    code: String(payload.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40),
    title: String(payload.title || '').trim().slice(0, 140), description: String(payload.description || '').trim().slice(0, 1000),
    discountType: payload.discountType === 'fixed' ? 'fixed' : 'percent', discountValue: Number(payload.discountValue), minOrder: Number(payload.minOrder || 0),
    startsAt: payload.startsAt || new Date().toISOString(), endsAt: payload.endsAt || new Date(Date.now() + 30 * 86400000).toISOString(), active: payload.active !== false && payload.active !== 'false', badge: String(payload.badge || 'OFFER').trim().slice(0, 40),
  };
  const startsAt = new Date(promotion.startsAt).getTime();
  const endsAt = new Date(promotion.endsAt).getTime();
  if (!promotion.code || !promotion.title || !Number.isFinite(promotion.discountValue) || promotion.discountValue <= 0 || promotion.discountValue > 1000000 || promotion.discountType === 'percent' && promotion.discountValue > 100 || !Number.isFinite(promotion.minOrder) || promotion.minOrder < 0 || promotion.minOrder > 1000000 || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) throw appError('Check the promotion code, discount and valid date range.');
  if (!isMysql) {
    if (state.promotions.some((p) => p.code === promotion.code && p.id !== Number(promotionId))) throw appError('That promotion code is already in use.', 409);
    if (promotionId) {
      const saved = state.promotions.find((p) => p.id === Number(promotionId));
      if (!saved) throw appError('Promotion not found.', 404);
      Object.assign(saved, promotion);
      return clone(saved);
    }
    const saved = { id: id('promotions'), ...promotion };
    state.promotions.push(saved);
    return clone(saved);
  }
  if (promotionId) {
    await pool.execute('UPDATE promotions SET code=?,title=?,description=?,discount_type=?,discount_value=?,min_order=?,starts_at=?,ends_at=?,is_active=?,badge=? WHERE id=?', [promotion.code, promotion.title, promotion.description, promotion.discountType, promotion.discountValue, promotion.minOrder, promotion.startsAt, promotion.endsAt, promotion.active ? 1 : 0, promotion.badge, promotionId]);
    return (await listPromotions()).find((p) => p.id === Number(promotionId));
  }
  const [result] = await pool.execute('INSERT INTO promotions (code,title,description,discount_type,discount_value,min_order,starts_at,ends_at,is_active,badge) VALUES (?,?,?,?,?,?,?,?,?,?)', [promotion.code, promotion.title, promotion.description, promotion.discountType, promotion.discountValue, promotion.minOrder, promotion.startsAt, promotion.endsAt, promotion.active ? 1 : 0, promotion.badge]);
  return (await listPromotions()).find((p) => p.id === Number(result.insertId));
}
export async function deletePromotion(promotionId) {
  if (!isMysql) {
    const index = state.promotions.findIndex((p) => p.id === Number(promotionId));
    if (index < 0) throw appError('Promotion not found.', 404);
    state.promotions.splice(index, 1);
    return { success: true };
  }
  const [result] = await pool.execute('DELETE FROM promotions WHERE id=?', [promotionId]);
  if (!result.affectedRows) throw appError('Promotion not found.', 404);
  return { success: true };
}
export async function getSettings() {
  if (!isMysql) return clone(state.settings);
  const [rows] = await pool.execute('SELECT setting_key,setting_value FROM app_settings');
  const result = {};
  for (const row of rows) result[row.setting_key] = parseJson(row.setting_value) ?? row.setting_value;
  return { agencyName: 'Pure Aqua', supportEmail: 'hello@pureaqua.example', supportPhone: '', deliveryFee: 25, freeDeliveryThreshold: 299, lowStockThreshold: 15, address: '', ...result };
}
export async function updateSettings(payload) {
  const current = await getSettings();
  const next = {
    agencyName: String(payload.agencyName ?? current.agencyName).trim().slice(0, 120), supportEmail: String(payload.supportEmail ?? current.supportEmail).trim().slice(0, 180),
    supportPhone: String(payload.supportPhone ?? current.supportPhone).trim().slice(0, 40), address: String(payload.address ?? current.address).trim().slice(0, 240),
    deliveryFee: Number(payload.deliveryFee ?? current.deliveryFee), freeDeliveryThreshold: Number(payload.freeDeliveryThreshold ?? current.freeDeliveryThreshold), lowStockThreshold: Number(payload.lowStockThreshold ?? current.lowStockThreshold),
  };
  if (!next.agencyName || next.supportEmail && !validEmail(next.supportEmail) || next.supportPhone && !validPhone(next.supportPhone) || !Number.isFinite(next.deliveryFee) || next.deliveryFee < 0 || next.deliveryFee > 1000000 || !Number.isFinite(next.freeDeliveryThreshold) || next.freeDeliveryThreshold < 0 || next.freeDeliveryThreshold > 1000000 || !Number.isSafeInteger(next.lowStockThreshold) || next.lowStockThreshold < 0) throw appError('Review your contact, delivery and inventory settings.');
  if (!isMysql) { state.settings = next; return clone(next); }
  for (const [key, value] of Object.entries(next)) await pool.execute('INSERT INTO app_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)', [key, JSON.stringify(value)]);
  return next;
}
export async function getPublicStoreInfo() {
  const settings = await getSettings();
  return { deliveryFee: Number(settings.deliveryFee ?? 25), freeDeliveryThreshold: Number(settings.freeDeliveryThreshold ?? 299), supportPhone: settings.supportPhone || '', supportEmail: settings.supportEmail || '', address: settings.address || 'Pune, Maharashtra' };
}
function lastMonths(count = 6) {
  const months = [];
  const d = new Date();
  d.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({ key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: date.toLocaleString('en-IN', { month: 'short' }), revenue: 0, orders: 0, customers: 0 });
  }
  return months;
}
export async function getAdminDashboard() {
  const settings = await getSettings();
  const threshold = Number(settings.lowStockThreshold ?? 15);
  if (!isMysql) {
    const paidOrders = state.orders.filter((o) => o.paymentStatus === 'PAID');
    const months = lastMonths(6);
    for (const order of paidOrders) {
      const date = new Date(order.createdAt);
      const bucket = months.find((m) => m.key === `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      if (bucket) { bucket.revenue += order.total; bucket.orders += 1; }
    }
    const customerGrowth = months.map((month) => ({ label: month.label, customers: state.users.filter((u) => String(u.createdAt).slice(0, 7) === month.key).length }));
    const topProducts = state.products.map((p) => ({ name: p.name, units: state.orders.flatMap((o) => o.items).filter((i) => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0), revenue: state.orders.flatMap((o) => o.items).filter((i) => i.productId === p.id).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) })).sort((a, b) => b.units - a.units).slice(0, 5);
    return {
      totalSales: round2(paidOrders.reduce((sum, o) => sum + o.total, 0)), totalOrders: state.orders.filter((o) => o.status !== 'PENDING_PAYMENT').length,
      totalCustomers: state.users.length, totalProducts: state.products.filter((p) => p.enabled).length,
      pendingOrders: state.orders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKED'].includes(o.status)).length,
      deliveredOrders: state.orders.filter((o) => o.status === 'DELIVERED').length,
      lowStockProducts: state.products.filter((p) => p.enabled && p.stock <= threshold).length,
      recentOrders: await getAdminOrders({}).then((orders) => orders.slice(0, 6)), salesSeries: months.map((m) => ({ label: m.label, revenue: round2(m.revenue), orders: m.orders })),
      customerGrowth, topProducts,
    };
  }
  const [[metrics]] = await pool.execute(`SELECT COALESCE(SUM(CASE WHEN payment_status='PAID' THEN total ELSE 0 END),0) AS total_sales,COUNT(CASE WHEN status<>'PENDING_PAYMENT' THEN 1 END) AS total_orders,(SELECT COUNT(*) FROM users) AS total_customers,(SELECT COUNT(*) FROM products WHERE enabled=1) AS total_products,COUNT(CASE WHEN status IN ('PLACED','CONFIRMED','PACKED') THEN 1 END) AS pending_orders,COUNT(CASE WHEN status='DELIVERED' THEN 1 END) AS delivered_orders FROM orders`);
  const [[low]] = await pool.execute('SELECT COUNT(*) AS total FROM products WHERE enabled=1 AND stock<=?', [threshold]);
  const [recent] = await pool.execute('SELECT o.*,u.name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 6');
  const recentOrders = await Promise.all(recent.map(async (row) => { const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id=?', [row.id]); return mapOrder(row, normalizeOrderItems(items)); }));
  const [sales] = await pool.execute('SELECT DATE_FORMAT(created_at,"%Y-%m") AS month_key,DATE_FORMAT(created_at,"%b") AS label,SUM(CASE WHEN payment_status="PAID" THEN total ELSE 0 END) AS revenue,COUNT(*) AS orders FROM orders WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 6 MONTH) GROUP BY month_key,label ORDER BY month_key');
  const months = lastMonths(6).map((m) => { const row = sales.find((s) => s.month_key === m.key); return { label: m.label, revenue: Number(row?.revenue || 0), orders: Number(row?.orders || 0) }; });
  const [top] = await pool.execute('SELECT oi.product_name AS name,SUM(oi.quantity) AS units,SUM(oi.unit_price*oi.quantity) AS revenue FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.payment_status="PAID" GROUP BY oi.product_id,oi.product_name ORDER BY units DESC LIMIT 5');
  const [growth] = await pool.execute('SELECT DATE_FORMAT(created_at,"%b") AS label,COUNT(*) AS customers FROM users WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(created_at,"%Y-%m"),label ORDER BY DATE_FORMAT(created_at,"%Y-%m")');
  return { totalSales: Number(metrics.total_sales), totalOrders: Number(metrics.total_orders), totalCustomers: Number(metrics.total_customers), totalProducts: Number(metrics.total_products), pendingOrders: Number(metrics.pending_orders), deliveredOrders: Number(metrics.delivered_orders), lowStockProducts: Number(low.total), recentOrders, salesSeries: months, customerGrowth: growth.map((r) => ({ label: r.label, customers: Number(r.customers) })), topProducts: top.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue) })) };
}
export async function getAnalytics() {
  const dashboard = await getAdminDashboard();
  const lowStockThreshold = Number((await getSettings()).lowStockThreshold ?? 15);
  if (!isMysql) {
    const total = state.orders.filter((o) => o.paymentStatus === 'PAID');
    return { ...dashboard, completedOrders: state.orders.filter((o) => o.status === 'DELIVERED').length, cancelledOrders: state.orders.filter((o) => o.status === 'CANCELLED').length, averageOrderValue: total.length ? round2(total.reduce((s, o) => s + o.total, 0) / total.length) : 0, inventory: state.products.map((p) => ({ name: p.name, stock: p.stock, status: p.stock === 0 ? 'OUT OF STOCK' : p.stock <= lowStockThreshold ? 'LOW STOCK' : 'IN STOCK' })) };
  }
  const [[summary]] = await pool.execute('SELECT COUNT(CASE WHEN status="DELIVERED" THEN 1 END) AS completed,COUNT(CASE WHEN status="CANCELLED" THEN 1 END) AS cancelled,AVG(CASE WHEN payment_status="PAID" THEN total END) AS average_order_value FROM orders');
  return { ...dashboard, completedOrders: Number(summary.completed), cancelledOrders: Number(summary.cancelled), averageOrderValue: Number(summary.average_order_value || 0), inventory: (await listInventory()).map((p) => ({ name: p.name, stock: p.stock, status: p.stock === 0 ? 'OUT OF STOCK' : p.stock <= lowStockThreshold ? 'LOW STOCK' : 'IN STOCK' })) };
}
