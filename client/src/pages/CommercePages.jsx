import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, ChevronRight, CreditCard, MapPin, Minus, Package, PackageCheck, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck, WalletCards, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import AddressForm from '../components/AddressForm';
import OrderTimeline from '../components/OrderTimeline';
import StatusPill from '../components/StatusPill';
import RatingStars from '../components/RatingStars';
import { BackLink, Breadcrumbs, EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Common';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
function productOf(item) { return item.product || item; }
function totalsFor(items, settings = {}) {
  const subtotal = items.reduce((sum, item) => sum + Number(productOf(item).price) * Number(item.quantity), 0);
  const discount = items.reduce((sum, item) => sum + Math.max(0, Number(productOf(item).price) - Number(productOf(item).effectivePrice ?? productOf(item).discountPrice ?? productOf(item).price)) * Number(item.quantity), 0);
  const payable = Math.max(0, subtotal - discount);
  const freeDeliveryThreshold = Number(settings.freeDeliveryThreshold ?? 299);
  const deliveryFee = Number(settings.deliveryFee ?? 25);
  const deliveryCharge = payable >= freeDeliveryThreshold ? 0 : deliveryFee;
  const tax = Math.round(payable * 0.05 * 100) / 100;
  return { subtotal, discount, deliveryCharge, tax, total: payable + deliveryCharge + tax, payable, freeDeliveryThreshold, deliveryFee };
}
function dateLabel(value) { return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'To be confirmed'; }
function SummaryCard({ totals, items, link, promoDiscount = 0, buttonLabel = 'Continue to checkout', disabled = false, onSubmit }) {
  const taxable = Math.max(0, totals.payable - promoDiscount);
  const threshold = Number(totals.freeDeliveryThreshold ?? 299);
  const delivery = taxable >= threshold ? 0 : Number(totals.deliveryFee ?? 25);
  const tax = Math.round(taxable * 0.05 * 100) / 100;
  const finalTotal = taxable + delivery + tax;
  return <aside className="order-summary-card"><div className="summary-heading"><div><span className="eyebrow">Your order</span><h2>Summary</h2></div><span className="summary-items-count">{items.reduce((sum, item) => sum + Number(item.quantity), 0)} items</span></div>
    <div className="summary-lines"><div><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>{(totals.discount + promoDiscount) > 0 && <div className="summary-discount"><span>Savings</span><strong>− {money(totals.discount + promoDiscount)}</strong></div>}<div><span>Delivery</span><strong>{delivery === 0 ? <span className="free-label">FREE</span> : money(delivery)}</strong></div><div><span>Tax (5%)</span><strong>{money(tax)}</strong></div></div>
    <div className="summary-total"><span>Total to pay</span><strong>{money(finalTotal)}</strong></div><p className="tax-note">Inclusive of applicable tax. Final amount confirmed securely at checkout.</p>
    {onSubmit ? <button className="btn btn-primary btn-full" disabled={disabled} onClick={onSubmit}>{buttonLabel} <ArrowRight size={16} /></button> : <Link className={`btn btn-primary btn-full ${disabled ? 'is-disabled' : ''}`} to={disabled ? '#' : link}>{buttonLabel} <ArrowRight size={16} /></Link>}
    <div className="summary-trust"><ShieldCheck size={16} /><span>Safe demo payment · no real charge</span></div>
  </aside>;
}

export function CartPage() {
  const { cartItems, setQuantity, removeFromCart, clearCart } = useShop();
  const [suggested, setSuggested] = useState([]);
  const [storeInfo, setStoreInfo] = useState({ deliveryFee: 25, freeDeliveryThreshold: 299 });
  const [workingId, setWorkingId] = useState(null);
  const toast = useToast();
  const totals = useMemo(() => totalsFor(cartItems, storeInfo), [cartItems, storeInfo]);
  useEffect(() => { api.get('/store-info').then(({ data }) => setStoreInfo(data.settings)).catch(() => {}); }, []);
  useEffect(() => { if (!cartItems.length) api.get('/products?sort=popular').then(({ data }) => setSuggested((data.products || []).slice(0, 3))).catch(() => {}); }, [cartItems.length]);
  const remove = async (item) => { setWorkingId(item.id); try { await removeFromCart(item); toast(`${productOf(item).name} removed from your cart.`, 'info'); } catch (error) { toast(getErrorMessage(error), 'error'); } finally { setWorkingId(null); } };
  const changeQuantity = async (item, quantity) => { setWorkingId(item.id); try { await setQuantity(item.id, quantity); } catch (error) { toast(getErrorMessage(error, 'Could not update quantity.'), 'error'); } finally { setWorkingId(null); } };
  const empty = !cartItems.length;
  return <div className="page-container commerce-page">
    <Breadcrumbs items={[{ label: 'Your cart' }]} />
    <PageHeading eyebrow="Almost at your doorstep" title="Your cart" description={empty ? 'A good day starts with water. Your next refreshing pick is only a click away.' : 'Take a moment to check your water order before you make it yours.'} actions={empty ? null : <span className="cart-count-label"><ShoppingBag size={16} /> {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>} />
    {empty ? <><EmptyState icon={ShoppingBag} eyebrow="Nothing in the basket yet" title="Your cart is taking a little water break." description="Browse the Pure Aqua range and find something refreshing for your day." action={<Link to="/products" className="btn btn-primary">Explore products <ArrowRight size={16} /></Link>} /><section className="cart-recommendations"><div className="section-heading-row"><div><span className="eyebrow">A good place to start</span><h2>Everyday favourites.</h2></div><Link to="/products" className="text-link">Shop all <ArrowRight size={15} /></Link></div><div className="product-grid">{suggested.map((product) => <ProductCard compact product={product} key={product.id} />)}</div></section></> : <div className="cart-layout"><div className="cart-items-column"><div className="cart-items-head"><span>Product</span><span>Quantity</span><span>Price</span></div>{cartItems.map((item) => { const product = productOf(item); return <article className="cart-item" key={item.id}><Link to={`/products/${product.id}`} className="cart-item-image"><img src={product.imageUrl} alt={product.name} onError={(e) => { e.currentTarget.src = '/images/product-500ml.svg'; }} /></Link><div className="cart-item-info"><span className="product-category">{product.sizeLabel || product.category}</span><Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><p>{product.description}</p><div className="cart-item-meta"><span className="stock-dot in-stock">In stock</span><button className="remove-link" disabled={workingId === item.id} onClick={() => remove(item)}><Trash2 size={14} /> Remove</button></div></div><div className="cart-item-quantity"><div className="quantity-stepper small-stepper"><button disabled={item.quantity <= 1 || workingId === item.id} onClick={() => changeQuantity(item, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{item.quantity}</span><button disabled={item.quantity >= (product.stock || 99) || workingId === item.id} onClick={() => changeQuantity(item, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><small>{product.stock} available</small></div><div className="cart-item-price"><strong>{money((product.effectivePrice ?? product.discountPrice ?? product.price) * item.quantity)}</strong>{product.discountPrice && <del>{money(product.price * item.quantity)}</del>}</div></article>; })}
      <div className="cart-bottom-links"><Link to="/products"><ArrowLeft size={15} /> Continue shopping</Link><button onClick={async () => { if (window.confirm('Remove all items from your cart?')) { await clearCart(); toast('Your cart has been cleared.', 'info'); } }}><Trash2 size={14} /> Clear cart</button></div><div className="cart-assurance"><span><Truck size={17} /> Local doorstep delivery</span><span><ShieldCheck size={17} /> Secure checkout</span><span><PackageCheck size={17} /> Track every order</span></div></div>
      <div className="cart-summary-sticky"><SummaryCard totals={totals} items={cartItems} link="/checkout" buttonLabel="Continue to checkout" /><div className="delivery-progress-card"><div className="delivery-progress-top"><span>Delivery perk</span><strong>{totals.payable >= totals.freeDeliveryThreshold ? 'Unlocked' : `${money(totals.freeDeliveryThreshold - totals.payable)} to go`}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, (totals.payable / totals.freeDeliveryThreshold) * 100)}%` }} /></div><p>{totals.payable >= totals.freeDeliveryThreshold ? 'Your order qualifies for free delivery.' : `Free delivery on orders above ${money(totals.freeDeliveryThreshold)}.`}</p></div></div></div>}
  </div>;
}

export function WishlistPage() {
  const { wishlistIds, toggleWishlist, addToCart } = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  useEffect(() => {
    let active = true;
    if (!wishlistIds.length) { setProducts([]); return () => { active = false; }; }
    setLoading(true); setError('');
    Promise.all(wishlistIds.map((id) => api.get(`/products/${id}`).then(({ data }) => data.product).catch(() => null))).then((items) => { if (active) setProducts(items.filter(Boolean)); }).catch((err) => { if (active) setError(getErrorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wishlistIds.join(',')]);
  const move = async (product) => { try { await addToCart(product); await toggleWishlist(product); } catch (err) { toast(getErrorMessage(err), 'error'); } };
  return <div className="page-container commerce-page"><Breadcrumbs items={[{ label: 'Wishlist' }]} /><PageHeading eyebrow="Saved for later" title="Your wishlist" description="A little collection of the Pure Aqua picks you’d like to come back to." actions={<span className="catalog-item-count">{wishlistIds.length} saved</span>} />
    {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : products.length ? <div className="wishlist-grid">{products.map((product) => <article className="wishlist-card" key={product.id}><Link className="wishlist-card-image" to={`/products/${product.id}`}><img src={product.imageUrl} alt={product.name} /></Link><div className="wishlist-card-info"><span className="product-category">{product.category} · {product.sizeLabel}</span><Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><RatingStars rating={product.rating} count={product.reviewCount} /><div className="wishlist-card-price"><strong>{money(product.effectivePrice ?? product.price)}</strong>{product.discountPrice && <del>{money(product.price)}</del>}</div><div className="wishlist-card-actions"><button className="btn btn-primary btn-small" disabled={!product.stock} onClick={() => move(product)}><ShoppingBag size={14} /> Move to cart</button><button className="remove-link" onClick={() => toggleWishlist(product)}><Trash2 size={14} /> Remove</button></div></div></article>)}</div> : <EmptyState icon={HeartIcon} eyebrow="A little collection of yours" title="Your wishlist is waiting for its first drop." description="Save your favourite bottles and jars here and come back whenever you’re ready." action={<Link to="/products" className="btn btn-primary">Find your favourites <ArrowRight size={16} /></Link>} />}
  </div>;
}
function HeartIcon(props) { return <ShoppingBag {...props} />; }

export function CheckoutPage() {
  const { cartItems } = useShop();
  const navigate = useNavigate();
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [storeInfo, setStoreInfo] = useState({ deliveryFee: 25, freeDeliveryThreshold: 299 });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const totals = useMemo(() => totalsFor(cartItems, storeInfo), [cartItems, storeInfo]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [addressResult, promotionResult, storeResult] = await Promise.all([api.get('/addresses'), api.get('/promotions'), api.get('/store-info')]);
      const list = addressResult.data.addresses || [];
      setAddresses(list); setSelectedAddress((current) => list.some((item) => item.id === current) ? current : list.find((item) => item.isDefault)?.id || list[0]?.id || null);
      setPromotions(promotionResult.data.promotions || []);
      setStoreInfo(storeResult.data.settings || { deliveryFee: 25, freeDeliveryThreshold: 299 });
    } catch (err) { setError(getErrorMessage(err, 'Could not load checkout information.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!cartItems.length) navigate('/cart', { replace: true }); else load(); }, [cartItems.length]);

  const applyPromo = () => {
    const found = promotions.find((item) => item.code.toUpperCase() === promoCode.trim().toUpperCase());
    if (!found) { setAppliedPromo(null); toast('That code isn’t active at the moment.', 'error'); return; }
    if (totals.payable < Number(found.minOrder)) { setAppliedPromo(null); toast(`This offer needs an order of at least ${money(found.minOrder)}.`, 'info'); return; }
    setAppliedPromo(found); toast(`${found.code} applied. Nice choice!`);
  };
  const promoDiscount = appliedPromo ? Math.round((appliedPromo.discountType === 'percent' ? totals.payable * Number(appliedPromo.discountValue) / 100 : Number(appliedPromo.discountValue)) * 100) / 100 : 0;
  const submit = async () => {
    if (!selectedAddress) { toast('Add a delivery address to continue.', 'error'); return; }
    setPlacing(true); setError('');
    try {
      const { data } = await api.post('/payment/create', { addressId: selectedAddress, promoCode: appliedPromo?.code || '', paymentMethod: 'MOCK' });
      navigate(`/payment/${data.orderId}`, { state: { intent: data } });
    } catch (err) { setError(getErrorMessage(err, 'Could not start the secure demo payment.')); }
    finally { setPlacing(false); }
  };

  if (!cartItems.length) return null;
  return <div className="page-container commerce-page checkout-page"><Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} /><PageHeading eyebrow="One last detail" title="Checkout" description="Your water is nearly on its way. Let’s make sure everything is just right." />
    {loading ? <LoadingState label="Getting your delivery details…" /> : error && !addresses.length ? <ErrorState message={error} onRetry={load} /> : <div className="checkout-layout"><div className="checkout-main-column">
      <section className="checkout-section"><div className="checkout-section-heading"><span className="checkout-step">01</span><div><h2>Delivery address</h2><p>Where should we bring your Pure Aqua order?</p></div><Link to="/addresses?returnTo=%2Fcheckout" className="text-link">Manage addresses <ArrowRight size={14} /></Link></div>
        {addresses.length ? <div className="address-choice-grid">{addresses.map((address) => <button key={address.id} className={`address-choice ${selectedAddress === address.id ? 'selected' : ''}`} onClick={() => setSelectedAddress(address.id)}><span className="address-choice-radio">{selectedAddress === address.id && <span />}</span><span className="address-choice-content"><strong>{address.fullName}</strong><span>{address.addressLine}</span><span>{address.city}, {address.state} {address.pincode}</span><small>{address.phone}</small></span>{address.isDefault && <span className="default-badge">DEFAULT</span>}</button>)}</div> : !showAddressForm && <div className="address-empty-note"><MapPin size={19} /><div><strong>We need a delivery address first.</strong><span>Add a saved address and your order can be on its way.</span></div></div>}
        {showAddressForm ? <div className="checkout-inline-address"><AddressForm submitLabel="Save and use address" onCancel={() => setShowAddressForm(false)} onSubmit={async (form) => { const { data } = await api.post('/addresses', { ...form, isDefault: form.isDefault || !addresses.length }); const next = [...addresses, data.address]; setAddresses(next); setSelectedAddress(data.address.id); setShowAddressForm(false); }} /></div> : <button className="add-address-link" onClick={() => setShowAddressForm(true)}><MapPin size={16} /> {addresses.length ? 'Add another address' : 'Add a delivery address'} <ArrowRight size={15} /></button>}
      </section>
      <section className="checkout-section"><div className="checkout-section-heading"><span className="checkout-step">02</span><div><h2>Payment method</h2><p>A safe mock payment flow for project demonstrations.</p></div></div><div className="payment-option selected"><span className="payment-radio"><span /></span><span className="payment-option-icon"><WalletCards size={20} /></span><span className="payment-option-copy"><strong>Pure Aqua secure test payment</strong><small>No real money is collected. Complete a simulated payment on the next step.</small></span><span className="payment-test-chip">TEST MODE</span></div><div className="secure-note"><ShieldCheck size={17} /><span>Payment references are simulated server-side. Never enter real card details.</span></div></section>
      <section className="checkout-section coupon-section"><div className="checkout-section-heading"><span className="checkout-step">03</span><div><h2>Got an offer code?</h2><p>Use a current Pure Aqua promotion at checkout.</p></div></div><div className="coupon-entry"><Tag size={17} /><input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter offer code" aria-label="Promotion code" /><button className="btn btn-outline btn-small" onClick={applyPromo}>Apply code</button></div>{appliedPromo && <div className="coupon-applied"><CheckCircle2 size={17} /><span><strong>{appliedPromo.code}</strong> applied — {appliedPromo.title}</span><button onClick={() => { setAppliedPromo(null); setPromoCode(''); }}>Remove</button></div>}{promotions.length > 0 && <p className="coupon-hint">Try {promotions.map((item) => item.code).join(' or ')} on eligible orders.</p>}</section>
      {error && <div className="form-alert form-alert-error">{error}</div>}
      <div className="checkout-bottom-actions"><Link to="/cart" className="back-link"><ArrowLeft size={15} /> Back to cart</Link><button className="btn btn-primary btn-large" onClick={submit} disabled={placing || !selectedAddress}>{placing ? 'Preparing payment…' : 'Place order & continue'} <ArrowRight size={16} /></button></div>
    </div><div className="checkout-summary-column"><SummaryCard totals={totals} items={cartItems} disabled={!selectedAddress || placing} onSubmit={submit} buttonLabel={placing ? 'Preparing payment…' : 'Continue to payment'} promoDiscount={promoDiscount} /><div className="checkout-delivery-note"><Truck size={18} /><span><strong>Estimated delivery</strong><small>Usually within 1–2 days in our local service area. {money(storeInfo.deliveryFee)} delivery under {money(storeInfo.freeDeliveryThreshold)}.</small></span></div></div></div>}
  </div>;
}

export function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshRemote } = useShop();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/orders/${id}`).then(({ data }) => { if (active) setOrder(data.order); }).catch((err) => { if (active) setError(getErrorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const complete = async (outcome = 'success') => {
    setPaying(true); setError('');
    try {
      const { data } = await api.post('/payment/verify', { orderId: Number(id), outcome });
      if (data.success) { await refreshRemote(); toast('Payment successful. Your order is placed.'); navigate(`/order-confirmation/${id}`, { replace: true }); }
      else { toast('The test payment was cancelled. No charge was made.', 'info'); navigate('/orders'); }
    } catch (err) { setError(getErrorMessage(err, 'Payment could not be completed.')); }
    finally { setPaying(false); }
  };
  if (loading) return <div className="page-container commerce-page"><LoadingState label="Preparing your secure payment…" /></div>;
  if (error && !order) return <div className="page-container commerce-page"><ErrorState message={error} onRetry={() => navigate('/orders')} /></div>;
  if (order?.paymentStatus !== 'PENDING') return <div className="page-container payment-page"><EmptyState icon={CheckCircle2} title="This payment has already been processed." description="You can view the latest order updates in your order history." action={<Link className="btn btn-primary" to={`/track/${order?.id}`}>Track this order <ArrowRight size={15} /></Link>} /></div>;
  return <div className="page-container payment-page"><Breadcrumbs items={[{ label: 'Checkout', to: '/checkout' }, { label: 'Secure payment' }]} /><div className="payment-card"><div className="payment-card-brand"><span className="payment-brand-mark"><ShieldCheck size={22} /></span><div><strong>Pure Aqua secure checkout</strong><small>Demonstration payment · TEST MODE</small></div><span className="test-mode-tag">MOCK</span></div><div className="payment-card-content"><div className="payment-status-icon"><CreditCard size={30} /></div><span className="eyebrow">Safe project payment</span><h1>Confirm your order.</h1><p>This is a simulated payment screen for the Pure Aqua project. No card details are needed and no real money will be collected.</p><div className="payment-reference-lines"><div><span>Order reference</span><strong>{order.orderNumber}</strong></div><div><span>Amount</span><strong className="payment-amount">{money(order.total)}</strong></div><div><span>Payment method</span><strong>Mock secure payment</strong></div></div>
      {error && <div className="form-alert form-alert-error">{error}</div>}
      <button className="btn btn-primary btn-large btn-full" onClick={() => complete('success')} disabled={paying}><CheckCircle2 size={18} />{paying ? 'Confirming test payment…' : `Confirm test payment · ${money(order.total)}`}</button><button className="payment-cancel" onClick={() => complete('failed')} disabled={paying}><XCircle size={15} /> Cancel this payment</button><div className="payment-fineprint"><ShieldCheck size={14} /> The demo payment status is validated by the Pure Aqua API. Never use real payment credentials here.</div></div></div></div>;
}

export function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api.get(`/orders/${id}`).then(({ data }) => { if (active) setOrder(data.order); }).catch((err) => { if (active) setError(getErrorMessage(err)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  if (loading) return <div className="page-container commerce-page"><LoadingState label="Preparing your order confirmation…" /></div>;
  if (error || !order) return <div className="page-container commerce-page"><ErrorState message={error || 'Order not found.'} onRetry={() => window.location.assign('/orders')} /></div>;
  return <div className="page-container confirmation-page"><div className="confirmation-success"><span className="confirmation-check"><Check size={31} /></span><span className="eyebrow">Your refreshment is on its way</span><h1>Order placed.<br /><em>Thank you.</em></h1><p>Payment successful. We’ve received your Pure Aqua order and our local delivery team is getting it ready.</p></div><div className="confirmation-detail-card"><div className="confirmation-order-top"><div><span>ORDER REFERENCE</span><strong>{order.orderNumber}</strong></div><StatusPill status={order.status} /></div><div className="confirmation-products">{order.items.map((item) => <div className="confirmation-product" key={item.id || item.productId}><img src={item.imageUrl} alt={item.name} /><span><strong>{item.name}</strong><small>{item.sizeLabel} · Qty {item.quantity}</small></span><b>{money(item.unitPrice * item.quantity)}</b></div>)}</div><div className="confirmation-meta"><div><span>Order date</span><strong>{dateLabel(order.createdAt)}</strong></div><div><span>Expected delivery</span><strong>{dateLabel(order.expectedDelivery)}</strong></div><div><span>Payment</span><strong className="payment-paid"><CheckCircle2 size={15} /> Paid · Mock test</strong></div></div><div className="confirmation-address"><MapPin size={17} /><div><strong>Delivering to {order.address?.fullName}</strong><span>{order.address?.addressLine}, {order.address?.city}, {order.address?.state} {order.address?.pincode}</span></div></div><div className="confirmation-total"><span>Total paid</span><strong>{money(order.total)}</strong></div><div className="confirmation-actions"><Link to={`/track/${order.id}`} className="btn btn-primary">Track your order <ArrowRight size={16} /></Link><Link to="/products" className="btn btn-outline">Continue shopping</Link></div></div></div>;
}

export function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api.get(`/orders/${id}`).then(({ data }) => { if (active) setOrder(data.order); }).catch((err) => { if (active) setError(getErrorMessage(err)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  if (loading) return <div className="page-container commerce-page"><LoadingState label="Finding your order…" /></div>;
  if (error || !order) return <div className="page-container commerce-page"><ErrorState message={error || 'Order not found.'} onRetry={() => window.location.assign('/orders')} /></div>;
  return <div className="page-container tracking-page"><Breadcrumbs items={[{ label: 'My orders', to: '/orders' }, { label: 'Track order' }]} /><PageHeading eyebrow="Your Pure Aqua delivery" title="Order tracking" description="A clear look at where your order is right now and what comes next." actions={<StatusPill status={order.status} />} />
    <div className="tracking-layout"><section className="tracking-progress-card"><div className="tracking-card-top"><div><span className="tracking-order-number">{order.orderNumber}</span><span className="tracking-order-date">Placed on {dateLabel(order.createdAt)}</span></div><div className="delivery-estimate"><Truck size={17} /><span><small>Estimated delivery</small><strong>{dateLabel(order.expectedDelivery)}</strong></span></div></div><OrderTimeline status={order.status} /></section><aside className="tracking-side-column"><section className="tracking-info-card"><span className="eyebrow">Delivery details</span><div className="tracking-address"><MapPin size={18} /><div><strong>{order.address?.fullName}</strong><span>{order.address?.addressLine}, {order.address?.city}, {order.address?.state} {order.address?.pincode}</span><small>{order.address?.phone}</small></div></div><div className="tracking-info-divider" /><div className="tracking-payment-row"><span>Payment status</span><StatusPill status={order.paymentStatus} /></div><div className="tracking-total-row"><span>Order total</span><strong>{money(order.total)}</strong></div></section><section className="tracking-info-card"><span className="eyebrow">In this order</span>{order.items.map((item) => <div className="tracking-item" key={item.id || item.productId}><img src={item.imageUrl} alt={item.name} /><span><strong>{item.name}</strong><small>{item.sizeLabel} · Qty {item.quantity}</small></span><b>{money(item.unitPrice * item.quantity)}</b></div>)}<Link to="/contact" className="tracking-help-link">Need a hand? Contact our team <ArrowRight size={14} /></Link></section></aside></div>
  </div>;
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchOrders = () => { setLoading(true); setError(''); api.get('/orders').then(({ data }) => setOrders(data.orders || [])).catch((err) => setError(getErrorMessage(err, 'Could not load your orders.'))).finally(() => setLoading(false)); };
  useEffect(() => { fetchOrders(); }, []);
  return <div className="page-container orders-page"><Breadcrumbs items={[{ label: 'My orders' }]} /><PageHeading eyebrow="Your order history" title="My orders" description="All your Pure Aqua orders, neatly in one place." actions={<Link to="/products" className="btn btn-outline btn-small">Shop again <ArrowRight size={14} /></Link>} />
    {loading ? <LoadingState label="Loading your order history…" /> : error ? <ErrorState message={error} onRetry={fetchOrders} /> : orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><span className="order-number-label">ORDER {order.orderNumber}</span><span className="order-date-label">Placed {dateLabel(order.createdAt)}</span></div><div className="order-status-group"><StatusPill status={order.status} /><StatusPill status={order.paymentStatus} /></div></div><div className="order-card-content"><div className="order-item-previews">{order.items.slice(0, 3).map((item) => <img src={item.imageUrl} alt={item.name} key={item.id || item.productId} />)}{order.items.length > 3 && <span className="order-more-items">+{order.items.length - 3}</span>}</div><div className="order-items-summary"><strong>{order.items.map((item) => item.name).join(', ')}</strong><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items · Est. {dateLabel(order.expectedDelivery)}</span></div><div className="order-total"><span>Order total</span><strong>{money(order.total)}</strong></div></div><div className="order-card-footer"><Link to={`/track/${order.id}`} className="text-link">Track order <ArrowRight size={14} /></Link><Link to={`/track/${order.id}`} className="btn btn-outline btn-small">View order <ChevronRight size={14} /></Link></div></article>)}</div> : <EmptyState icon={Package} eyebrow="A fresh start" title="No orders just yet." description="Your first Pure Aqua delivery is a few refreshing clicks away." action={<Link to="/products" className="btn btn-primary">Explore products <ArrowRight size={16} /></Link>} />}
  </div>;
}
