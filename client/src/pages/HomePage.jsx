import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Check, Clock3, Droplet, FlaskConical, HeartHandshake, Leaf, MapPin, PackageCheck, ShieldCheck, Sparkles, Truck, Waves, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import RatingStars from '../components/RatingStars';
import { ErrorState, LoadingState } from '../components/Common';
import { getErrorMessage } from '../services/api';

const qualitySteps = [
  { number: '01', title: 'Careful filtration', description: 'A considered multi-stage process helps remove unwanted particles while preserving a clean, fresh taste.' },
  { number: '02', title: 'Quality checks', description: 'Routine checks help us keep a close eye on consistency and handling at every step.' },
  { number: '03', title: 'Cleanly sealed', description: 'Bottles and jars are hygienically sealed and handled with care before they leave us.' },
];
const trustItems = [
  { icon: ShieldCheck, title: 'Quality-minded', copy: 'Handled with care at every step' },
  { icon: Truck, title: 'Local delivery', copy: 'Convenient doorstep drop-offs' },
  { icon: Clock3, title: 'Easy to reorder', copy: 'Your regular water, made simple' },
];
const stars = [
  { quote: 'The 20L jars arrive when we need them and ordering is straightforward. A lovely dependable service for our office.', name: 'Aarav M.', location: 'Pune · Home & office', rating: 5 },
  { quote: 'Good everyday bottles and a smooth checkout. I like that I can keep track of delivery from my account.', name: 'Nisha K.', location: 'Pune · Regular customer', rating: 5 },
  { quote: 'The family bottle pack is handy to keep at home. Friendly delivery and clear updates along the way.', name: 'Kabir S.', location: 'Pune · Family order', rating: 4 },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/products?sort=popular'), api.get('/reviews')]).then(([productResult, reviewResult]) => {
      if (!active) return;
      setProducts(productResult.data.products.slice(0, 3));
      setReviews(reviewResult.data.reviews.slice(0, 3));
    }).catch((err) => { if (active) setError(getErrorMessage(err, 'We could not load the latest products.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <>
    <section className="hero-section">
      <div className="hero-backdrop" aria-hidden="true" />
      <div className="hero-inner page-container">
        <div className="hero-content">
          <span className="hero-pill"><Droplet size={14} fill="currentColor" /> Pure Aqua for everyday</span>
          <h1>Pure Water.<br /><span>Pure Life.</span></h1>
          <p>Premium mineral water delivered fresh to your doorstep. A little more care in every drop, and a whole lot less effort in your day.</p>
          <div className="hero-actions"><Link to="/products" className="btn btn-primary btn-large">Shop now <ArrowRight size={17} /></Link><Link to="/about" className="btn btn-glass btn-large">Discover Pure Aqua <ArrowRight size={17} /></Link></div>
          <div className="hero-note"><div className="hero-avatar-stack"><span>PA</span><span>✓</span><span>✦</span></div><span><strong>A fresh choice for your everyday</strong><small>Thoughtfully sourced. Carefully delivered.</small></span></div>
        </div>
        <div className="hero-image-caption"><span className="caption-orbit"><Droplet size={14} /></span><span><strong>Everyday hydration, made easy</strong><small>Good water, right where you need it.</small></span></div>
      </div>
      <div className="hero-bottom-shape" aria-hidden="true" />
    </section>

    <section className="trust-strip page-container" aria-label="Pure Aqua commitments">{trustItems.map(({ icon: Icon, title, copy }) => <div className="trust-item" key={title}><span className="trust-icon"><Icon size={20} /></span><span><strong>{title}</strong><small>{copy}</small></span></div>)}</section>

    <section className="section-space page-container">
      <div className="section-heading-row"><div><span className="eyebrow">The Pure Aqua favourites</span><h2>Good water, for every day.</h2><p>From a little bottle for the road to a jar for the whole room.</p></div><Link to="/products" className="text-link">Shop all products <ArrowRight size={16} /></Link></div>
      {loading ? <div className="product-grid">{[1, 2, 3].map((n) => <div className="skeleton-product" key={n}><div /><span /><span /></div>)}</div> : error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    </section>

    <section className="quality-feature section-space">
      <div className="page-container quality-layout">
        <div className="quality-visual"><img src="/images/quality-lab.svg" alt="Illustration of careful water quality checks" /><div className="quality-stamp"><BadgeCheck size={18} /><span>Quality<br />comes first</span></div></div>
        <div className="quality-copy"><span className="eyebrow">A little care goes a long way</span><h2>Water you can feel good about bringing home.</h2><p>From careful filtration to the final seal, we focus on the details that help make everyday hydration feel dependable. Clear process, consistent handling, and no grand claims—just care you can count on.</p>
          <div className="quality-checks"><span><Check size={15} /> Routine quality checks</span><span><Check size={15} /> Clean, secure packaging</span><span><Check size={15} /> Reliable local delivery</span></div>
          <Link to="/quality" className="btn btn-outline">Explore our quality promise <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>

    <section className="section-space page-container why-section">
      <div className="center-heading"><span className="eyebrow">A better way to keep water close</span><h2>Small details. A refreshing difference.</h2><p>Pure Aqua is built around the simple things that make a regular water order work better.</p></div>
      <div className="benefit-grid">
        <article className="benefit-card"><span className="benefit-icon"><FlaskConical size={23} /></span><h3>Careful at every step</h3><p>Clear processes and routine checks support consistent quality from preparation to packaging.</p><Link to="/quality" className="subtle-link">How we care <ArrowRight size={14} /></Link></article>
        <article className="benefit-card"><span className="benefit-icon aqua-icon"><Truck size={23} /></span><h3>Water that comes to you</h3><p>Place an order in a few taps and follow its progress from confirmation to your doorstep.</p><Link to="/delivery" className="subtle-link">Our delivery promise <ArrowRight size={14} /></Link></article>
        <article className="benefit-card"><span className="benefit-icon mint-icon"><HeartHandshake size={23} /></span><h3>Made for real routines</h3><p>Choose a grab-and-go bottle, a family-sized pack, or a larger jar for shared spaces.</p><Link to="/products" className="subtle-link">Find your format <ArrowRight size={14} /></Link></article>
      </div>
    </section>

    <section className="hydration-band">
      <div className="page-container hydration-layout"><div><span className="eyebrow eyebrow-light">Make room for a water break</span><h2>Everyday hydration,<br />at your own pace.</h2><p>Water is an important part of a balanced day. Keep a refreshing glass close, especially when you are active or the weather is warm. Choose the routine that feels right for you.</p><Link to="/products" className="btn btn-white">Find your everyday water <ArrowRight size={16} /></Link></div><div className="hydration-art"><div className="hydration-water-circle"><Waves size={94} strokeWidth={1.1} /></div><div className="hydration-floating"><Droplet size={30} fill="currentColor" /><span>stay<br />refreshed</span></div><span className="bubble bubble-one" /><span className="bubble bubble-two" /><span className="bubble bubble-three" /></div></div>
    </section>

    <section className="section-space page-container process-section">
      <div className="section-heading-row"><div><span className="eyebrow">From our care to your doorstep</span><h2>Simple by nature.</h2><p>A thoughtful process that keeps your order moving smoothly.</p></div><Link to="/about" className="text-link">More about our agency <ArrowRight size={16} /></Link></div>
      <div className="process-grid">{qualitySteps.map((step) => <article className="process-card" key={step.number}><span className="process-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
    </section>

    <section className="delivery-banner"><div className="page-container delivery-banner-inner"><div className="delivery-art"><img src="/images/delivery.svg" alt="Pure Aqua local delivery van illustration" /></div><div className="delivery-banner-copy"><span className="eyebrow">A little closer to home</span><h2>We’ll bring the good stuff to you.</h2><p>Our local delivery team helps make restocking easy. Follow every order through your account and know what’s coming next.</p><div className="delivery-points"><span><MapPin size={16} /> Local availability</span><span><PackageCheck size={16} /> Order updates</span></div><Link to="/delivery" className="btn btn-primary">How delivery works <ArrowRight size={16} /></Link></div></div></section>

    <section className="section-space page-container testimonials-section"><div className="section-heading-row"><div><span className="eyebrow">Kind words from customers</span><h2>Good days, one delivery at a time.</h2><p>Thoughtful feedback from the Pure Aqua community.</p></div><Link to="/reviews" className="text-link">Read all reviews <ArrowRight size={16} /></Link></div>
      <div className="testimonial-grid">{(reviews.length ? reviews.map((review) => ({ quote: review.body, name: review.customerName || 'Pure Aqua customer', location: review.productName || 'Pure Aqua customer', rating: review.rating, title: review.title })) : stars).map((review, index) => <article className="testimonial-card" key={`${review.name}-${index}`}><div className="quote-mark">“</div><RatingStars rating={review.rating} size={15} /><h3>{review.title || 'A refreshing experience'}</h3><p>“{review.quote}”</p><div className="testimonial-person"><span className="person-avatar">{review.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{review.name}</strong><small>{review.location}</small></span></div></article>)}</div>
    </section>

    <section className="offers-callout section-space"><div className="page-container offers-callout-inner"><div className="offer-circle"><Sparkles size={26} /></div><div><span className="eyebrow eyebrow-light">A refreshing little extra</span><h2>Better value, more ways to stock up.</h2><p>Discover first-order savings and special pricing on bulk jar orders.</p></div><Link to="/offers" className="btn btn-white">See current offers <ArrowRight size={16} /></Link></div></section>
    <section className="bottom-cta page-container"><div><span className="eyebrow">Ready when you are</span><h2>Make your next water run a little easier.</h2></div><Link to="/products" className="btn btn-primary btn-large">Shop Pure Aqua <ArrowRight size={17} /></Link></section>
  </>;
}
