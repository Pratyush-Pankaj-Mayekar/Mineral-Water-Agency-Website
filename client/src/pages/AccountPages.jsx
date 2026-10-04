import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, Eye, EyeOff, Heart, KeyRound, LockKeyhole, LogOut, Mail, MapPin, Package, Pencil, Phone, Plus, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddressForm from '../components/AddressForm';
import StatusPill from '../components/StatusPill';
import { Breadcrumbs, EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Common';

function AuthFrame({ eyebrow, title, intro, children, footer }) {
  return <div className="auth-page page-container"><div className="auth-card"><div className="auth-card-side"><span className="auth-side-orbit"><span className="auth-side-drop">✦</span></span><span className="eyebrow eyebrow-light">{eyebrow}</span><h2>Good water.<br />Good to go.</h2><p>{intro}</p><div className="auth-side-note"><ShieldCheck size={16} /> A thoughtful little refresh, delivered.</div><div className="auth-side-wave" /></div><div className="auth-card-main"><div className="auth-main-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}{footer && <div className="auth-footer-note">{footer}</div>}</div></div></div>;
}
function PasswordField({ label = 'Password', value, onChange, autoComplete = 'current-password', name = 'password' }) {
  const [visible, setVisible] = useState(false);
  return <label className="form-field"><span>{label}</span><div className="password-input"><LockKeyhole size={17} /><input type={visible ? 'text' : 'password'} name={name} autoComplete={autoComplete} minLength={8} value={value} onChange={onChange} required /><button type="button" className="icon-button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>;
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!loading && user) return <Navigate to={location.state?.from || '/profile'} replace />;
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { await login(form); toast('Welcome back to Pure Aqua.'); navigate(location.state?.from || '/profile', { replace: true }); } catch (err) { setError(getErrorMessage(err, 'Sign in could not be completed.')); } finally { setBusy(false); } };
  return <AuthFrame eyebrow="Welcome back" title="Sign in to your account" intro="Keep your favourite water close, follow an order, and make your next delivery a little easier." footer={<>New to Pure Aqua? <Link to="/register">Create an account <ArrowRight size={13} /></Link></>}>
    <form className="auth-form" onSubmit={submit}>{error && <div className="form-alert form-alert-error">{error}</div>}<label className="form-field"><span>Email address</span><div className="input-with-icon"><Mail size={17} /><input name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="you@example.com" required /></div></label><PasswordField value={form.password} onChange={change} /><div className="auth-form-between"><span className="form-security-note"><ShieldCheck size={14} /> Secure 7-day session</span><Link to="/forgot-password">Forgot password?</Link></div><button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button><div className="auth-demo-credentials"><span className="demo-label"><BadgeCheck size={14} /> DEMO CUSTOMER</span><div><span>Email</span><code>customer@pureaqua.demo</code></div><div><span>Password</span><code>Aqua@1234</code></div><button type="button" onClick={() => setForm({ email: 'customer@pureaqua.demo', password: 'Aqua@1234' })}>Use demo account <ChevronRight size={14} /></button></div></form>
  </AuthFrame>;
}

export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (!loading && user) return <Navigate to="/profile" replace />;
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (form.name.trim().length < 2 || !/^[+\d][\d\s()-]{7,18}$/.test(form.phone.trim())) { setError('Add a full name and a valid phone number.'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) { setError('Use at least 8 characters with a capital letter, a lowercase letter and a number.'); return; }
    if (form.password !== form.confirmPassword) { setError('Your passwords do not match.'); return; }
    setBusy(true); try { await register({ name: form.name, email: form.email, phone: form.phone, password: form.password }); toast('Your Pure Aqua account is ready.'); navigate(location.state?.from || '/profile', { replace: true }); } catch (err) { setError(getErrorMessage(err, 'Registration could not be completed.')); } finally { setBusy(false); }
  };
  return <AuthFrame eyebrow="A fresh start" title="Create your account" intro="A few details, then you’re ready to explore products, save your favourites, and follow your deliveries." footer={<>Already have an account? <Link to="/login">Sign in <ArrowRight size={13} /></Link></>}>
    <form className="auth-form" onSubmit={submit}>{error && <div className="form-alert form-alert-error">{error}</div>}<label className="form-field"><span>Full name</span><div className="input-with-icon"><UserRound size={17} /><input name="name" autoComplete="name" value={form.name} onChange={change} placeholder="Your name" required /></div></label><label className="form-field"><span>Email address</span><div className="input-with-icon"><Mail size={17} /><input name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="you@example.com" required /></div></label><label className="form-field"><span>Phone number</span><div className="input-with-icon"><Phone size={17} /><input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} placeholder="+91 98765 43210" required /></div></label><PasswordField label="Create password" name="password" autoComplete="new-password" value={form.password} onChange={change} /><PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={change} /><p className="password-hint">At least 8 characters, including uppercase, lowercase and a number.</p><button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'Creating your account…' : 'Create account'} <ArrowRight size={16} /></button></form>
  </AuthFrame>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { const { data } = await api.post('/auth/forgot-password', { email }); setResult(data); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); } };
  return <AuthFrame eyebrow="Account recovery" title="Reset your password" intro="Enter the email linked to your account. If it exists, we’ll prepare a secure reset link." footer={<Link to="/login">Back to sign in <ArrowRight size={13} /></Link>}>
    {result ? <div className="reset-result"><span className="reset-result-icon"><CheckCircle2 size={24} /></span><h2>Check your reset instructions.</h2><p>{result.message}</p>{result.demoResetToken && <div className="demo-reset-panel"><span className="demo-label"><KeyRound size={14} /> DEVELOPMENT RESET LINK</span><p>Email delivery isn’t configured, so use this one-time development link:</p><Link className="btn btn-primary btn-small" to={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(result.demoResetToken)}`}>Set a new password <ArrowRight size={14} /></Link></div>}<Link className="text-link" to="/login">Return to sign in <ArrowRight size={14} /></Link></div> : <form className="auth-form" onSubmit={submit}>{error && <div className="form-alert form-alert-error">{error}</div>}<label className="form-field"><span>Email address</span><div className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div></label><button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'Preparing reset…' : 'Send reset instructions'} <ArrowRight size={16} /></button><p className="form-security-note"><ShieldCheck size={15} /> Reset tokens expire after 30 minutes and are stored as a hash.</p></form>}
  </AuthFrame>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const toast = useToast();
  const [email, setEmail] = useState(params.get('email') || ''); const [token, setToken] = useState(params.get('token') || ''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(''); if (password !== confirm) { setError('Your passwords do not match.'); return; } setBusy(true); try { await api.post('/auth/reset-password', { email, token, password }); toast('Password reset. Please sign in.'); navigate('/login', { replace: true }); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); } };
  return <AuthFrame eyebrow="Secure account recovery" title="Choose a new password" intro="Create a strong password you haven’t used before. Reset links are valid for 30 minutes." footer={<Link to="/login">Back to sign in <ArrowRight size={13} /></Link>}><form className="auth-form" onSubmit={submit}>{error && <div className="form-alert form-alert-error">{error}</div>}<label className="form-field"><span>Email address</span><div className="input-with-icon"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></label><label className="form-field"><span>Reset token</span><div className="input-with-icon"><KeyRound size={17} /><input value={token} onChange={(e) => setToken(e.target.value)} required /></div></label><PasswordField label="New password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><p className="password-hint">At least 8 characters, including uppercase, lowercase and a number.</p><button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'Saving password…' : 'Reset password'} <ArrowRight size={16} /></button></form></AuthFrame>;
}

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth(); const toast = useToast(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [orderCount, setOrderCount] = useState(null);
  useEffect(() => { if (user) setForm({ name: user.name, phone: user.phone || '' }); }, [user]);
  useEffect(() => { api.get('/orders').then(({ data }) => setOrderCount(data.orders.length)).catch(() => setOrderCount(null)); }, []);
  const save = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { await updateProfile(form); toast('Your account details have been updated.'); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); } };
  const signOut = async () => { await logout(); toast('You have been signed out.', 'info'); navigate('/'); };
  return <div className="page-container account-page"><Breadcrumbs items={[{ label: 'My account' }]} /><PageHeading eyebrow="Your Pure Aqua account" title={`Hello, ${user?.name?.split(' ')[0] || 'there'}.`} description="Manage your details, keep addresses close, and find your recent deliveries." actions={<button className="btn btn-ghost btn-small" onClick={signOut}><LogOut size={15} /> Sign out</button>} />
    <div className="account-overview-grid"><div className="account-profile-card"><div className="account-profile-top"><span className="large-account-avatar">{user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><span className="account-verified"><BadgeCheck size={14} /> Pure Aqua customer</span><h2>{user?.name}</h2><span>{user?.email}</span></div></div><div className="account-stat-row"><div><strong>{orderCount ?? '—'}</strong><span>Orders</span></div><div><strong>Member</strong><span>Since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'today'}</span></div></div></div>
      <div className="account-quick-links"><Link to="/orders"><span className="quick-link-icon"><Package size={19} /></span><span><strong>My orders</strong><small>View or track an order</small></span><ChevronRight size={17} /></Link><Link to="/addresses"><span className="quick-link-icon"><MapPin size={19} /></span><span><strong>Saved addresses</strong><small>Manage delivery details</small></span><ChevronRight size={17} /></Link><Link to="/wishlist"><span className="quick-link-icon"><Heart size={19} /></span><span><strong>Wishlist</strong><small>Products you’ve saved</small></span><ChevronRight size={17} /></Link><Link to="/reviews"><span className="quick-link-icon"><BadgeCheck size={19} /></span><span><strong>Customer reviews</strong><small>Share your experience</small></span><ChevronRight size={17} /></Link></div></div>
    <section className="profile-edit-section"><div className="profile-section-heading"><div><span className="eyebrow">Account information</span><h2>Your details</h2><p>Keep your contact information up to date.</p></div></div><form className="profile-form" onSubmit={save}>{error && <div className="form-alert form-alert-error">{error}</div>}<div className="form-grid two-col"><label className="form-field"><span>Full name</span><input autoComplete="name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required /></label><label className="form-field"><span>Email address</span><div className="input-readonly"><Mail size={15} /><input value={user?.email || ''} readOnly aria-readonly="true" /><span>Verified</span></div><small>Email address cannot be changed here.</small></label><label className="form-field"><span>Phone number</span><input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} required /></label></div><div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving changes…' : 'Save changes'} <ArrowRight size={15} /></button></div></form></section>
  </div>;
}
export function AddressesPage() {
  const [addresses, setAddresses] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null);
  const navigate = useNavigate(); const location = useLocation(); const toast = useToast();
  const returnTo = new URLSearchParams(location.search).get('returnTo');
  const load = () => { setLoading(true); setError(''); api.get('/addresses').then(({ data }) => setAddresses(data.addresses || [])).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const save = async (form) => {
    if (editing) await api.put(`/addresses/${editing.id}`, form); else await api.post('/addresses', form);
    if (returnTo) navigate(returnTo); else { setEditing(null); setShowForm(false); load(); }
  };
  const makeDefault = async (address) => { try { await api.put(`/addresses/${address.id}`, { ...address, isDefault: true }); load(); toast('Default delivery address updated.'); } catch (err) { toast(getErrorMessage(err), 'error'); } };
  const remove = async (address) => { if (!window.confirm(`Remove the address for ${address.city}?`)) return; try { await api.delete(`/addresses/${address.id}`); load(); toast('Address removed.', 'info'); } catch (err) { toast(getErrorMessage(err), 'error'); } };
  return <div className="page-container account-page"><Breadcrumbs items={[{ label: 'My account', to: '/profile' }, { label: 'Saved addresses' }]} /><PageHeading eyebrow="Ready for the next delivery" title="Saved addresses" description="Your delivery details, kept safely in your account." actions={!showForm && <button className="btn btn-primary btn-small" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Add address</button>} />
    {showForm || editing ? <section className="address-edit-card"><div className="address-edit-heading"><div><span className="eyebrow">{editing ? 'Update your details' : 'A new drop-off point'}</span><h2>{editing ? 'Edit address' : 'Add a delivery address'}</h2></div><button className="icon-button" aria-label="Close address form" onClick={() => { setEditing(null); setShowForm(false); }}><X size={18} /></button></div><AddressForm initialData={editing || undefined} onCancel={() => { setEditing(null); setShowForm(false); }} onSubmit={save} submitLabel={editing ? 'Update address' : 'Save address'} /></section> : null}
    {loading ? <LoadingState label="Loading your addresses…" /> : error ? <ErrorState message={error} onRetry={load} /> : addresses.length ? <div className="saved-address-grid">{addresses.map((address) => <article className={`saved-address-card ${address.isDefault ? 'is-default-address' : ''}`} key={address.id}><div className="saved-address-top"><span className="saved-address-icon"><MapPin size={19} /></span>{address.isDefault ? <span className="default-address-pill"><CheckCircle2 size={13} /> DEFAULT</span> : <span className="address-type-label">DELIVERY ADDRESS</span>}</div><h3>{address.fullName}</h3><p>{address.addressLine}<br />{address.city}, {address.state} {address.pincode}</p><span className="address-phone"><Phone size={14} />{address.phone}</span><div className="saved-address-actions"><button onClick={() => { setEditing(address); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil size={14} /> Edit</button><button onClick={() => remove(address)}><Trash2 size={14} /> Remove</button>{!address.isDefault && <button className="set-default-link" onClick={() => makeDefault(address)}>Set default</button>}</div></article>)}</div> : !showForm && <EmptyState icon={MapPin} eyebrow="First address, first delivery" title="Where should we bring it?" description="Save an address now and checkout will be that much easier next time." action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add your first address</button>} />}
  </div>;
}
