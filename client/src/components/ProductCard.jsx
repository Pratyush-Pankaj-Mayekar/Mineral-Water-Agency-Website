import { ArrowUpRight, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import RatingStars from './RatingStars';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function ProductCard({ product, compact = false }) {
  const { addToCart, toggleWishlist, wishlistIds } = useShop();
  const toast = useToast();
  const wished = wishlistIds.includes(Number(product.id));
  const discounted = product.discountPrice !== null && product.discountPrice !== undefined && Number(product.discountPrice) < Number(product.price);

  const add = async () => {
    try { await addToCart(product); } catch (error) { toast(error.response?.data?.message || 'Could not add this item right now.', 'error'); }
  };
  const wish = async () => {
    try { await toggleWishlist(product); } catch (error) { toast(error.response?.data?.message || 'Could not update your wishlist.', 'error'); }
  };

  return <article className={`product-card ${compact ? 'product-card-compact' : ''}`}>
    <div className="product-media">
      <Link to={`/products/${product.id}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <img src={product.imageUrl || '/images/product-500ml.svg'} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/product-500ml.svg'; }} />
      </Link>
      {discounted ? <span className="product-badge sale-badge">SAVE {Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)}%</span> : <span className="product-badge"><Sparkles size={12} /> PURE PICK</span>}
      <button className={`wishlist-icon ${wished ? 'is-wished' : ''}`} onClick={wish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={18} fill={wished ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="product-card-body">
      <div className="product-card-top"><span className="product-category">{product.category || 'Pure Aqua'}</span><span className={`stock-dot ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>{product.stock > 0 ? 'In stock' : 'Out of stock'}</span></div>
      <Link to={`/products/${product.id}`} className="product-name-link"><h3>{product.name}</h3></Link>
      {!compact && <p className="product-description">{product.description}</p>}
      <RatingStars rating={product.rating} count={product.reviewCount} />
      <div className="product-buy-row">
        <div className="price-stack"><strong>{formatPrice(discounted ? product.discountPrice : product.price)}</strong>{discounted && <del>{formatPrice(product.price)}</del>}</div>
        <button className="add-cart-button" onClick={add} disabled={!product.stock} aria-label={`Add ${product.name} to cart`}><ShoppingBag size={16} /><span>Add</span></button>
      </div>
      <Link to={`/products/${product.id}`} className="product-details-link">Product details <ArrowUpRight size={14} /></Link>
    </div>
  </article>;
}
