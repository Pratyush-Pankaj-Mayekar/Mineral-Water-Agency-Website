import { appError } from '../middleware/errors.js';

export const cleanText = (value, max = 500) => String(value ?? '').trim().slice(0, max);
export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
export const validPhone = (value) => /^[+\d][\d\s()-]{7,18}$/.test(String(value || '').trim());
export const asPositiveInt = (value, label = 'Value') => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw appError(`${label} must be a positive whole number.`);
  return n;
};
export const asMoney = (value, label = 'Price') => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) throw appError(`${label} must be a valid non-negative amount.`);
  return Math.round(n * 100) / 100;
};
export const slugify = (value) => cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const ensure = (condition, message, status = 400) => { if (!condition) throw appError(message, status); };
