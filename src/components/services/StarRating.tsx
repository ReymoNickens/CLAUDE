'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: false;
}

interface InteractiveStarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive: true;
  onChange: (rating: number) => void;
}

type Props = StarRatingProps | InteractiveStarRatingProps;

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' };

export function StarRating(props: Props) {
  const { value, max = 5, size = 'md' } = props;
  const [hovered, setHovered] = useState(0);
  const interactive = 'interactive' in props && props.interactive;

  const display = interactive ? (hovered || value) : value;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${star} star${star !== 1 ? 's' : ''}` : undefined}
          className={SIZES[size]}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && 'onChange' in props && props.onChange(star)}
        >
          <svg
            viewBox="0 0 24 24"
            className={`${SIZES[size]} transition-colors`}
            fill={star <= display ? '#FFD700' : 'none'}
            stroke={star <= display ? '#FFD700' : '#d1d5db'}
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </span>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-muted-foreground font-medium">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
