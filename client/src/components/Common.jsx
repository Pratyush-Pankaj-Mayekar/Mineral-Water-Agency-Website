import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Droplets, LoaderCircle, PackageOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function PageHeading({ eyebrow, title, description, actions, compact = false }) {
  return <div className={`page-heading ${compact ? 'page-heading-compact' : ''}`}>
    <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="page-heading-actions">{actions}</div>}
  </div>;
}
export function Breadcrumbs({ items = [] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link>{items.map((item, index) => <span key={`${item.label}-${index}`}>{' / '}{item.to && index !== items.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}
export function LoadingState({ label = 'Loading your Pure Aqua experience…', small = false }) {
  return <div className={`loading-state ${small ? 'loading-small' : ''}`} role="status"><LoaderCircle className="spin" size={small ? 21 : 28} /><span>{label}</span></div>;
}
export function EmptyState({ icon: Icon = PackageOpen, eyebrow, title, description, action, compact = false }) {
  return <div className={`empty-state ${compact ? 'empty-state-compact' : ''}`}><span className="empty-icon"><Icon size={26} /></span>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2><p>{description}</p>{action}</div>;
}
export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return <div className="error-state"><span className="error-watermark"><Droplets size={29} /></span><strong>We couldn’t load this just yet</strong><p>{message}</p>{onRetry && <button className="btn btn-outline btn-small" onClick={onRetry}>Try again <ArrowRight size={15} /></button>}</div>;
}
export function ProtectedRoute({ children, role = 'customer' }) {
  const { user, admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Checking your secure session…" />;
  if (role === 'admin') return admin ? children : <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function BackLink({ to = -1, children = 'Go back' }) {
  return <Link className="back-link" to={to}><ArrowLeft size={15} /> {children}</Link>;
}
