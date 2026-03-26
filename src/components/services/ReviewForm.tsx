'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  serviceId: string;
  onSubmitted: (rating: number, body: string) => void;
}

export function ReviewForm({ serviceId, onSubmitted }: ReviewFormProps) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Sign in to leave a review.'); setLoading(false); return; }

    const { error: insertErr } = await supabase.from('service_reviews').insert({
      service_id: serviceId,
      user_id: user.id,
      rating,
      body: body.trim() || null,
    });

    setLoading(false);

    if (insertErr) {
      if (insertErr.code === '23505') {
        setError('You have already reviewed this service.');
      } else {
        setError(insertErr.message);
      }
      return;
    }

    onSubmitted(rating, body.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">Leave a Review</h3>

      <div>
        <p className="mb-1 text-xs text-muted-foreground">Your rating</p>
        <StarRating value={rating} size="lg" interactive onChange={setRating} />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience (optional)…"
        rows={3}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!rating || loading}
        className="flex h-9 w-full items-center justify-center rounded-lg bg-[#003087] text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
      </button>
    </form>
  );
}
