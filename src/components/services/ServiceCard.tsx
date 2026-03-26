import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const firstPhoto = service.photos?.[0] ?? null;

  return (
    <Link href={`/services/${service.id}`} className="block">
      <article className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm active:scale-[0.98] transition-transform">
        {/* Photo / icon */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {firstPhoto ? (
            <Image src={firstPhoto} alt={service.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">
              {CATEGORY_ICONS[service.category] ?? '🏪'}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-foreground truncate">{service.name}</h3>
          <p className="text-xs text-[#003087] font-medium mb-1">{service.category}</p>
          {service.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <StarRating value={service.avg_rating} size="sm" />
            <span className="text-xs text-muted-foreground">({service.review_count})</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Chop Bars':   '🍲',
  Printing:      '🖨️',
  Salons:        '✂️',
  Tailors:       '🧵',
  'Phone Repair':'📱',
  Pharmacies:    '💊',
  Tutors:        '📚',
  Laundry:       '👕',
};
