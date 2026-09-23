import { useState } from 'react';
import { Star } from 'lucide-react';
import { useMarket, useAuth, useUI } from '../../context/AppContext';
import { Field, RatingStars } from '../common/UI';
export function ReviewCard({ review: r }) {
  return (
    <article className="review-card">
      <div className="between">
        <div>
          <strong>{r.customer}</strong>
          <small>{r.date}</small>
        </div>
        <RatingStars rating={r.rating} />
      </div>
      <p>{r.comment}</p>
    </article>
  );
}
export function ReviewForm({ order, item }) {
  const [rating, setRating] = useState(5),
    [comment, setComment] = useState(''),
    [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { reviews, submitReview } = useMarket();
  const { notify } = useUI();
  const existing = reviews.some(
    (r) => r.orderId === order.id && r.productId === item.productId && r.customerId === user.id,
  );
  if (order.status !== 'Completed' || order.customerId !== user.id) return null;
  if (existing)
    return <div className="notice">Thank you! Your review for {item.name} has been shared.</div>;
  return (
    <form
      className="panel review-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        if (busy) return;
        setBusy(true);
        try {
          await submitReview({
            orderId: order.id,
            productId: item.productId,
            rating,
            comment: comment.trim(),
          });
        } catch (failure) {
          notify(failure.message, 'error');
          return;
        } finally {
          setBusy(false);
        }
        notify('Your review has been posted.');
      }}
    >
      <h3>How was your {item.name}?</h3>
      <div className="star-picker" role="group" aria-label="Review rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            aria-label={n + ' stars'}
            aria-pressed={rating === n}
            key={n}
            onClick={() => setRating(n)}
          >
            <Star fill={n <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <Field label="Your review">
        <textarea
          minLength={5}
          maxLength={1000}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about the freshness, quality, and your experience."
        />
      </Field>
      <button className="btn" disabled={busy}>
        {busy ? 'Posting…' : 'Share review'}
      </button>
    </form>
  );
}
