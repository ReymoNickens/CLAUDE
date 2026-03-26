'use client';

import { useState } from 'react';
import { ReviewForm } from './ReviewForm';
import { StarRating } from './StarRating';
import type { ServiceReview, Profile } from '@/types';

type ReviewWithProfile = ServiceReview & {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

interface ReviewsSectionProps {
  serviceId: string;
  initialReviews: ReviewWithProfile[];
  hasReviewed: boolean;
  canReview: boolean;
}

export function ReviewsSection({ serviceId, initialReviews, hasReviewed, canReview }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [submitted, setSubmitted] = useState(hasReviewed);

  function handleSubmitted(rating: number, body: string) {
    const newReview: ReviewWithProfile = {
      id: crypto.randomUUID(),
      service_id: serviceId,
      user_id: '',
      rating,
      body: body || null,
      created_at: new Date().toISOString(),
      profiles: { full_name: 'You', avatar_url: null },
    };
    setReviews((prev) => [newReview, ...prev]);
    setSubmitted(true);
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">
        Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
      </h3>

      {canReview && !submitted && (
        <ReviewForm serviceId={serviceId} onSubmitted={handleSubmitted} />
      )}

      {reviews.length === 0 && submitted && (
        <p className="text-sm text-muted-foreground py-4 text-center">No other reviews yet.</p>
      )}
      {reviews.length === 0 && !submitted && (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      )}

      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003087]/10 text-xs font-semibold text-[#003087]">
              {(r.profiles?.full_name ?? 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.profiles?.full_name ?? 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <StarRating value={r.rating} size="sm" />
          </div>
          {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}
