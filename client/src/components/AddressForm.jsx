import { useState } from 'react';
import { MapPin, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const empty = { fullName: '', phone: '', addressLine: '', city: '', state: '', pincode: '', isDefault: false };
export default function AddressForm({ initialData = empty, onSubmit, onCancel, submitLabel = 'Save address' }) {
  const [form, setForm] = useState({ ...empty, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (form.fullName.trim().length < 2 || !/^[+\d][\d\s()-]{7,18}$/.test(form.phone.trim()) || form.addressLine.trim().length < 5 || !form.city.trim() || !form.state.trim() || !/^\d{5,6}$/.test(form.pincode.trim())) { setError('Please check each field. Phone and postal code should be valid.'); return; }
    setSaving(true);
    try { await onSubmit(form); toast(initialData.id ? 'Address updated.' : 'Address saved.'); }
    catch (err) { setError(getErrorMessage(err, 'Could not save this address.')); }
    finally { setSaving(false); }
  };
  return <form className="address-form" onSubmit={submit}>
    {error && <div className="form-alert form-alert-error">{error}</div>}
    <div className="form-grid two-col"><label className="form-field"><span>Full name</span><input name="fullName" autoComplete="name" value={form.fullName} onChange={change} required /></label><label className="form-field"><span>Phone number</span><input name="phone" autoComplete="tel" type="tel" value={form.phone} onChange={change} placeholder="+91 98765 43210" required /></label></div>
    <label className="form-field"><span>Address line</span><input name="addressLine" autoComplete="street-address" value={form.addressLine} onChange={change} placeholder="House, street, apartment" required /></label>
    <div className="form-grid three-col"><label className="form-field"><span>City</span><input name="city" autoComplete="address-level2" value={form.city} onChange={change} required /></label><label className="form-field"><span>State</span><input name="state" autoComplete="address-level1" value={form.state} onChange={change} required /></label><label className="form-field"><span>Pincode</span><input name="pincode" autoComplete="postal-code" inputMode="numeric" maxLength="6" value={form.pincode} onChange={change} required /></label></div>
    <label className="checkbox-line"><input type="checkbox" name="isDefault" checked={Boolean(form.isDefault)} onChange={change} /><span>Set as my default delivery address</span></label>
    <div className="form-actions"><button className="btn btn-primary" disabled={saving}><Save size={16} />{saving ? 'Saving…' : submitLabel}</button>{onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}
