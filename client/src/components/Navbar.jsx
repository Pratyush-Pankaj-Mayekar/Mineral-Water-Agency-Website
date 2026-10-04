import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Droplets, Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'Our story' },
  { to: '/quality', label: 'Our quality' },
  { to: '/offers', label: 'Offers' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const { cartCount, wishlistIds } = useShop();
  const toast = useToast();
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };
  const signOut = async () => {
    await logout();
    toast('You have been signed out.', 'info');
    navigate('/');
  };
  const activeClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return <>
    <div className="announcement-bar"><span><span className="announcement-dot" /> Fresh local delivery, right to your doorstep</span><Link to="/delivery">How delivery works <span aria-hidden="true">↗</span></Link></div>
    <header className="site-header">
      <div className="nav-shell page-container">
        <Link to="/" className="brand" aria-label="Pure Aqua home" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Droplets size={24} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>pure aqua</strong><small>PURE WATER. PURE LIFE.</small></span>
        </Link>
        <nav className={`main-nav ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={activeClass} onClick={() => setMobileOpen(false)}>{link.label}</NavLink>)}
          <NavLink to="/contact" className={activeClass} onClick={() => setMobileOpen(false)}>Contact</NavLink>
          <Link to="/orders" className="mobile-account-link" onClick={() => setMobileOpen(false)}>My orders</Link>
          {user && <button className="mobile-account-link nav-signout" onClick={signOut}>Sign out</button>}
        </nav>
        <div className="nav-actions">
          <button className={`icon-button nav-action ${searchOpen ? 'selected' : ''}`} onClick={() => setSearchOpen((value) => !value)} aria-label="Search products"><Search size={20} /></button>
          <Link className="icon-button nav-action wish-action" to="/wishlist" aria-label={`Wishlist, ${wishlistIds.length} products`}><Heart size={20} /><span className="nav-count">{wishlistIds.length}</span></Link>
          <Link className="icon-button nav-action cart-action" to="/cart" aria-label={`Cart, ${cartCount} items`}><ShoppingBag size={20} /><span className="nav-count">{cartCount}</span></Link>
          {user ? <div className="account-wrap"><Link to="/profile" className="account-avatar" aria-label="Your profile">{user.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Link><div className="account-menu"><Link to="/profile">My account</Link><Link to="/orders">My orders</Link><button onClick={signOut}>Sign out</button></div></div> : <Link to="/login" className="nav-login"><UserRound size={17} /><span>Sign in</span></Link>}
          <button className="mobile-toggle icon-button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {searchOpen && <form className="nav-search page-container" onSubmit={submitSearch}><Search size={18} /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bottles, jars, value packs..." aria-label="Search products" /><button type="submit" className="btn btn-primary btn-small">Search</button></form>}
    </header>
  </>;
}
