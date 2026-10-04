import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Bell, Box, ChevronRight, Droplets, Gauge, LayoutDashboard, LogOut, Menu, MessageSquareText, Package, Settings, ShoppingBag, Star, Tags, Truck, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const navGroups = [
  { label: 'WORKSPACE', links: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/inventory', label: 'Inventory', icon: Box },
    { to: '/admin/customers', label: 'Customers', icon: Users },
  ] },
  { label: 'ENGAGEMENT', links: [
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquareText },
    { to: '/admin/promotions', label: 'Promotions', icon: Tags },
  ] },
  { label: 'INSIGHTS', links: [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ] },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { admin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const exit = async () => { await logout(); toast('Admin session ended.', 'info'); navigate('/admin/login', { replace: true }); };
  const closeMenu = () => setMobileOpen(false);
  return <div className="admin-app-shell">
    {mobileOpen && <button aria-label="Close admin navigation" className="admin-mobile-scrim" onClick={closeMenu} />}
    <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar-open' : ''}`}>
      <div className="admin-brand"><span className="admin-brand-mark"><Droplets size={22} /></span><span><strong>PURE AQUA</strong><small>AGENCY CONSOLE</small></span><button className="admin-mobile-close" onClick={closeMenu} aria-label="Close menu"><X size={19} /></button></div>
      <div className="admin-sidebar-scroll">{navGroups.map((group) => <div className="admin-nav-group" key={group.label}><span className="admin-nav-group-label">{group.label}</span>{group.links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}><Icon size={18} /><span>{label}</span>{label === 'Messages' && <span className="nav-live-dot" />}</NavLink>)}</div>)}</div>
      <div className="admin-sidebar-help"><span className="admin-help-icon"><Droplet size={18} /></span><div><strong>Need a hand?</strong><small>Your Pure Aqua workspace</small></div><ChevronRight size={15} /></div>
      <div className="admin-sidebar-user"><span className="admin-user-avatar">{admin?.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'PA'}</span><span className="admin-user-copy"><strong>{admin?.name || 'Pure Aqua Admin'}</strong><small>Administrator</small></span><button className="admin-logout-button" onClick={exit} aria-label="Sign out"><LogOut size={17} /></button></div>
    </aside>
    <div className="admin-main-area"><header className="admin-topbar"><button className="admin-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open admin menu"><Menu size={21} /></button><div className="admin-crumb"><span>Pure Aqua</span><ChevronRight size={14} /><strong>Agency console</strong></div><div className="admin-topbar-actions"><span className="admin-live-status"><i /> All systems ready</span><span className="admin-topbar-divider" /><Link to="/" className="admin-view-store">View store <ChevronRight size={14} /></Link><span className="admin-topbar-avatar">{admin?.name?.slice(0, 1) || 'P'}</span></div></header><main className="admin-content"><Outlet /></main><footer className="admin-footer"><span>PURE AQUA · AGENCY CONSOLE</span><span>Clear water. Clear view.</span></footer></div>
  </div>;
}
