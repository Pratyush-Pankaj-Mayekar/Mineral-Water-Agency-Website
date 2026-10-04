const classes = {
  PLACED: 'status-blue', CONFIRMED: 'status-blue', PACKED: 'status-violet', OUT_FOR_DELIVERY: 'status-amber', DELIVERED: 'status-green', CANCELLED: 'status-red',
  PAID: 'status-green', PENDING: 'status-amber', FAILED: 'status-red', REFUNDED: 'status-violet', APPROVED: 'status-green', REJECTED: 'status-red', NEW: 'status-blue', READ: 'status-violet', RESOLVED: 'status-green',
};
export default function StatusPill({ status }) {
  const label = String(status || 'UNKNOWN').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`status-pill ${classes[status] || 'status-neutral'}`}><i />{label}</span>;
}
