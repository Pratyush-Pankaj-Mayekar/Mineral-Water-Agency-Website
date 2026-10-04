export const seedCategories = [
  { id: 1, name: 'Bottled Water', slug: 'bottled-water', description: 'Freshly sealed water for everyday hydration.' },
  { id: 2, name: 'Home & Office', slug: 'home-office', description: 'Convenient larger formats for shared spaces.' },
  { id: 3, name: 'Value Packs', slug: 'value-packs', description: 'Better value for families, events and teams.' },
];

export const seedProducts = [
  {
    id: 1, categoryId: 1, categoryName: 'Bottled Water', name: '500ml Bottle', slug: '500ml-bottle', sizeLabel: '500 ml',
    description: 'Perfect for on-the-go hydration. Small, lightweight, and easy to carry.',
    imageUrl: '/images/product-500ml.svg', price: 10, discountPrice: null, stock: 240, rating: 4.8, reviewCount: 38, enabled: true,
    createdAt: '2025-05-20T10:00:00.000Z',
  },
  {
    id: 2, categoryId: 1, categoryName: 'Bottled Water', name: '1L Bottle', slug: '1l-bottle', sizeLabel: '1 L',
    description: 'Stay refreshed all day long with our 1L bottle, ideal for daily use.',
    imageUrl: '/images/product-1l.svg', price: 15, discountPrice: null, stock: 180, rating: 4.9, reviewCount: 52, enabled: true,
    createdAt: '2025-05-20T10:00:00.000Z',
  },
  {
    id: 3, categoryId: 2, categoryName: 'Home & Office', name: '20L Jar', slug: '20l-jar', sizeLabel: '20 L',
    description: 'Ideal for home and office use. Provides a long-lasting supply of clean water.',
    imageUrl: '/images/product-20l.svg', price: 30, discountPrice: null, stock: 74, rating: 4.9, reviewCount: 67, enabled: true,
    createdAt: '2025-05-20T10:00:00.000Z',
  },
  {
    id: 4, categoryId: 1, categoryName: 'Bottled Water', name: '2L Family Bottle', slug: '2l-family-bottle', sizeLabel: '2 L',
    description: 'A generous bottle for the table, the road, or sharing a little more refreshment.',
    imageUrl: '/images/product-2l.svg', price: 25, discountPrice: 22, stock: 96, rating: 4.7, reviewCount: 24, enabled: true,
    createdAt: '2025-07-12T10:00:00.000Z',
  },
  {
    id: 5, categoryId: 3, categoryName: 'Value Packs', name: '1L Bottle Case · 6 Pack', slug: '1l-bottle-case-6-pack', sizeLabel: '6 × 1 L',
    description: 'Six everyday bottles in one convenient pack. A simple way to keep the fridge stocked.',
    imageUrl: '/images/product-case.svg', price: 90, discountPrice: 84, stock: 58, rating: 4.8, reviewCount: 19, enabled: true,
    createdAt: '2025-08-05T10:00:00.000Z',
  },
];

export const seedPromotions = [
  { id: 1, code: 'PURE10', title: 'A little more for less', description: 'Save 10% on your first order over ₹199.', discountType: 'percent', discountValue: 10, minOrder: 199, startsAt: '2025-01-01T00:00:00.000Z', endsAt: '2027-12-31T23:59:59.000Z', active: true, badge: 'FIRST ORDER' },
  { id: 2, code: 'JAR5', title: 'Bulk jar savings', description: 'Save ₹5 on home and office orders of 20L jars.', discountType: 'fixed', discountValue: 5, minOrder: 60, startsAt: '2025-01-01T00:00:00.000Z', endsAt: '2027-12-31T23:59:59.000Z', active: true, badge: 'BULK OFFER' },
];
