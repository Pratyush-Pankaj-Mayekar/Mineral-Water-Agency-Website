import { useEffect, useState } from 'react';
import { ArrowUpRight, Droplets, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Footer() {
  const [storeInfo, setStoreInfo] = useState({ supportPhone: '+91 80000 12345', supportEmail: 'hello@pureaqua.example', address: 'Pune, Maharashtra' });
  useEffect(() => { let active = true; api.get('/store-info').then(({ data }) => { if (active) setStoreInfo((current) => ({ ...current, ...data.settings })); }).catch(() => {}); return () => { active = false; }; }, []);
  const phoneLink = storeInfo.supportPhone?.replace(/[^+\d]/g, '') || '';
  return <footer className="site-footer">
    <div className="footer-wave" aria-hidden="true" />
    <div className="page-container footer-main">
      <div className="footer-brand-col">
        <Link to="/" className="brand footer-brand"><span className="brand-mark"><Droplets size={23} /></span><span className="brand-copy"><strong>pure aqua</strong><small>PURE WATER. PURE LIFE.</small></span></Link>
        <p>Good water makes room for good days. We bring dependable, carefully handled hydration a little closer to home.</p>
        <div className="footer-assurance"><ShieldCheck size={16} /> Thoughtfully sourced. Carefully delivered.</div>
      </div>
      <div className="footer-links-col"><h4>Explore</h4><Link to="/products">Shop all water</Link><Link to="/offers">Offers & bundles</Link><Link to="/about">Our story</Link><Link to="/quality">Quality assurance</Link></div>
      <div className="footer-links-col"><h4>Customer care</h4><Link to="/contact">Contact us</Link><Link to="/delivery">Delivery information</Link><Link to="/orders">Track an order</Link><Link to="/reviews">Customer reviews</Link></div>
      <div className="footer-contact-col"><h4>We’re here to help</h4>{storeInfo.address && <span><MapPin size={16} /> {storeInfo.address}</span>}{storeInfo.supportPhone && <a href={`tel:${phoneLink}`}><Phone size={16} /> {storeInfo.supportPhone}</a>}{storeInfo.supportEmail && <a href={`mailto:${storeInfo.supportEmail}`}><Mail size={16} /> {storeInfo.supportEmail}</a>}<Link className="footer-contact-link" to="/contact">Send us a message <ArrowUpRight size={15} /></Link></div>
    </div>
    <div className="page-container footer-bottom"><span>© {new Date().getFullYear()} Pure Aqua. All rights reserved.</span><span>Pure Water. Pure Life.</span><Link to="/admin/login" className="admin-entry">Agency admin <ArrowUpRight size={12} /></Link></div>
  </footer>;
}
