import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Filter, Heart, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Sparkles, Truck, X } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import RatingStars from '../components/RatingStars';
import { Breadcrumbs, EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Common';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({ category: searchParams.get('category') || '', minPrice: '', maxPrice: '', size: '', available: '', rating: '', sort: 'popular' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
    setFilters((current) => ({ ...current, category: searchParams.get('category') || '' }));
  }, [searchParams]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => setCategories([])); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    api.get(`/products?${params.toString()}`).then(({ data }) => { if (active) setProducts(data.products || []); }).catch((err) => { if (active) setError(getErrorMessage(err, 'We could not load the catalogue.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => { setQuery(''); setFilters({ category: '', minPrice: '', maxPrice: '', size: '', available: '', rating: '', sort: 'popular' }); setSearchParams({}); };
  const onSearch = (event) => { event.preventDefault(); setSearchParams(query.trim() ? { search: query.trim() } : {}); };
  const anyFilters = query || Object.values(filters).some((value, index) => index < 6 && value);

  return <div className="catalog-page page-container">
    <Breadcrumbs items={[{ label: 'Shop' }]} />
    <PageHeading eyebrow="The Pure Aqua shop" title="Find your fresh." description="A thoughtful little range of clean, refreshing water for the moments and places that matter." actions={<span className="catalog-item-count">{loading ? 'Refreshing the shelves…' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}</span>} />
    <div className="catalog-search-row"><form className="catalog-search" onSubmit={onSearch}><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product or size" aria-label="Search products" /><button type="submit" className="btn btn-primary">Search</button></form><button className="filter-mobile-toggle btn btn-outline" onClick={() => setMobileFilters((v) => !v)}><SlidersHorizontal size={17} /> Filters</button><label className="sort-control"><span>Sort by</span><select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}><option value="popular">Popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option><option value="rated">Highest rated</option></select><ChevronDown size={14} /></label></div>
    <div className="catalog-layout">
      <aside className={`filter-panel ${mobileFilters ? 'filters-open' : ''}`}>
        <div className="filter-panel-head"><div><SlidersHorizontal size={17} /><strong>Filters</strong></div><button className="icon-button filter-close" aria-label="Close filters" onClick={() => setMobileFilters(false)}><X size={18} /></button><button className="filter-clear" onClick={clearFilters}>Clear all</button></div>
        <div className="filter-group"><h3>Category</h3><label className="radio-line"><input type="radio" name="category" checked={!filters.category} onChange={() => updateFilter('category', '')} /><span>All water</span></label>{categories.map((category) => <label className="radio-line" key={category.id}><input type="radio" name="category" value={category.id} checked={String(filters.category) === String(category.id)} onChange={() => updateFilter('category', String(category.id))} /><span>{category.name}</span></label>)}</div>
        <div className="filter-group"><h3>Price range</h3><div className="price-range-inputs"><label><span>Min ₹</span><input type="number" min="0" placeholder="0" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} /></label><span className="price-dash">—</span><label><span>Max ₹</span><input type="number" min="0" placeholder="500" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} /></label></div></div>
        <div className="filter-group"><h3>Size</h3><select className="filter-select" value={filters.size} onChange={(e) => updateFilter('size', e.target.value)}><option value="">Any size</option><option value="500 ml">500 ml</option><option value="1 L">1 L</option><option value="2 L">2 L</option><option value="20 L">20 L</option><option value="Pack">Value pack</option></select></div>
        <div className="filter-group"><h3>Availability</h3><label className="radio-line"><input type="radio" name="availability" checked={!filters.available} onChange={() => updateFilter('available', '')} /><span>Show all</span></label><label className="radio-line"><input type="radio" name="availability" checked={filters.available === 'true'} onChange={() => updateFilter('available', 'true')} /><span>In stock only</span></label><label className="radio-line"><input type="radio" name="availability" checked={filters.available === 'false'} onChange={() => updateFilter('available', 'false')} /><span>Out of stock</span></label></div>
        <div className="filter-group"><h3>Customer rating</h3><label className="radio-line"><input type="radio" name="rating" checked={!filters.rating} onChange={() => updateFilter('rating', '')} /><span>Any rating</span></label><label className="radio-line"><input type="radio" name="rating" checked={filters.rating === '4'} onChange={() => updateFilter('rating', '4')} /><span>4 stars & up</span></label><label className="radio-line"><input type="radio" name="rating" checked={filters.rating === '3'} onChange={() => updateFilter('rating', '3')} /><span>3 stars & up</span></label></div>
      </aside>
      {mobileFilters && <button className="filter-scrim" aria-label="Close filters" onClick={() => setMobileFilters(false)} />}
      <div className="catalog-results">
        {loading ? <div className="product-grid">{[1, 2, 3, 4].map((n) => <div className="skeleton-product" key={n}><div /><span /><span /></div>)}</div> : error ? <ErrorState message={error} onRetry={() => setQuery((current) => `${current} `)} /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState icon={Filter} eyebrow="A clear shelf" title="No products found" description="Try adjusting your search or filters. Your next refreshing find may be just a small change away." action={<button className="btn btn-primary" onClick={clearFilters}>Clear filters <ArrowRight size={15} /></button>} />}
        {!loading && anyFilters && products.length > 0 && <button className="catalog-clear-inline" onClick={clearFilters}>Clear search & filters <X size={14} /></button>}
      </div>
    </div>
  </div>;
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlistIds } = useShop();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setQuantity(1);
    Promise.all([api.get(`/products/${id}`), api.get('/products?sort=popular'), api.get(`/reviews?productId=${id}`)]).then(([productResult, allResult, reviewResult]) => {
      if (!active) return;
      const current = productResult.data.product;
      setProduct(current);
      setRelated((allResult.data.products || []).filter((item) => item.id !== current.id).slice(0, 3));
      setReviews(reviewResult.data.reviews || []);
    }).catch((err) => { if (active) setError(getErrorMessage(err, 'We could not load this product.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const wishlisted = useMemo(() => product && wishlistIds.includes(Number(product.id)), [product, wishlistIds]);
  const add = async (buyNow = false) => {
    if (!product) return;
    setAdding(true);
    try { await addToCart(product, quantity); if (buyNow) navigate('/cart'); }
    catch (err) { toast(getErrorMessage(err, 'Could not add the product to your cart.'), 'error'); }
    finally { setAdding(false); }
  };
  const wish = async () => { try { await toggleWishlist(product); } catch (err) { toast(getErrorMessage(err), 'error'); } };

  if (loading) return <div className="page-container detail-loading"><LoadingState label="Finding the details…" /></div>;
  if (error || !product) return <div className="page-container detail-error"><Breadcrumbs items={[{ label: 'Shop', to: '/products' }, { label: 'Product' }]} /><ErrorState message={error || 'This product is no longer available.'} onRetry={() => navigate('/products')} /></div>;
  const discounted = product.discountPrice !== null && product.discountPrice < product.price;

  return <div className="page-container product-detail-page">
    <Breadcrumbs items={[{ label: 'Shop', to: '/products' }, { label: product.name }]} />
    <div className="product-detail-layout">
      <div className="detail-visual"><img src={product.imageUrl} alt={product.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/product-500ml.svg'; }} /><span className="detail-image-note"><Check size={14} /> Pure Aqua quality promise</span></div>
      <div className="detail-info"><span className="product-category">{product.category} <span className="dot-separator">·</span> {product.sizeLabel}</span><h1>{product.name}</h1><RatingStars rating={product.rating} count={product.reviewCount} showValue /><p className="detail-description">{product.description}</p>
        <div className="detail-price-row"><strong>{money(discounted ? product.discountPrice : product.price)}</strong>{discounted && <><del>{money(product.price)}</del><span className="detail-save">Save {money(product.price - product.discountPrice)}</span></>}</div>
        <p className={`detail-availability ${product.stock > 0 ? 'available' : 'unavailable'}`}><span className="availability-pip" />{product.stock > 0 ? `${product.stock <= 15 ? 'Only ' : ''}${product.stock} available` : 'Currently out of stock'}</p>
        <div className="quantity-order-row"><div className="quantity-stepper"><button disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button disabled={quantity >= Math.min(20, product.stock)} onClick={() => setQuantity((value) => Math.min(Math.min(20, product.stock), value + 1))} aria-label="Increase quantity"><Plus size={15} /></button></div><span className="quantity-hint">Choose quantity</span></div>
        <div className="detail-actions"><button className="btn btn-primary btn-large" disabled={!product.stock || adding} onClick={() => add(false)}><ShoppingBag size={18} /> {adding ? 'Adding…' : 'Add to cart'}</button><button className="btn btn-outline btn-large" disabled={!product.stock || adding} onClick={() => add(true)}>Buy now <ArrowRight size={17} /></button><button className={`btn-wish-large ${wishlisted ? 'wished' : ''}`} onClick={wish} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={19} fill={wishlisted ? 'currentColor' : 'none'} /></button></div>
        <div className="delivery-mini-card"><span className="delivery-mini-icon"><Truck size={19} /></span><span><strong>Fresh to your doorstep</strong><small>Local delivery with convenient order tracking.</small></span><Link to="/delivery" aria-label="Read delivery information"><ArrowRight size={16} /></Link></div>
        <div className="detail-accordion"><details open><summary>Product notes <ChevronDown size={16} /></summary><p>Store in a cool, dry place away from direct sunlight. Please check the seal before use.</p></details><details><summary>Delivery & availability <ChevronDown size={16} /></summary><p>We currently serve selected local areas. Add your delivery address at checkout to see your saved delivery details.</p></details></div>
      </div>
    </div>
    <section className="detail-review-section"><div className="detail-review-heading"><div><span className="eyebrow">Real customer notes</span><h2>Reviews for {product.name}</h2></div><div className="detail-rating-summary"><strong>{Number(product.rating || 0).toFixed(1)}</strong><RatingStars rating={product.rating} count={product.reviewCount} /></div></div>
      {reviews.length ? <div className="review-list">{reviews.slice(0, 3).map((review) => <article className="review-card" key={review.id}><RatingStars rating={review.rating} /><h3>{review.title || 'A customer review'}</h3><p>{review.body}</p><div className="review-byline"><strong>{review.customerName || 'Pure Aqua customer'}</strong><span>{new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div></article>)}</div> : <div className="detail-no-reviews"><Sparkles size={18} /><span>Be the first to leave a note about this product.</span><Link to="/reviews">Share a review <ArrowRight size={14} /></Link></div>}
    </section>
    {!!related.length && <section className="related-products"><div className="section-heading-row"><div><span className="eyebrow">You might also like</span><h2>More ways to stay refreshed.</h2></div><Link to="/products" className="text-link">View all <ArrowRight size={15} /></Link></div><div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.id} compact />)}</div></section>}
  </div>;
}
