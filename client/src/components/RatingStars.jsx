import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, count, size = 15, showValue = false }) {
  const rounded = Math.round(Number(rating) || 0);
  return <span className="rating-line" aria-label={`${Number(rating || 0).toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} reviews` : ''}`}>
    <span className="star-row" aria-hidden="true">{[1, 2, 3, 4, 5].map((number) => <Star key={number} size={size} fill={number <= rounded ? 'currentColor' : 'none'} strokeWidth={number <= rounded ? 1.7 : 1.4} className={number <= rounded ? 'star-filled' : 'star-empty'} />)}</span>
    {showValue && <span className="rating-value">{Number(rating || 0).toFixed(1)}</span>}
    {count !== undefined && <span className="rating-count">({count})</span>}
  </span>;
}
