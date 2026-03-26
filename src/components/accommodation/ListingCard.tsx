import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { AmenitiesChips } from './AmenitiesChips';
import type { Accommodation } from '@/types';

interface ListingCardProps {
  listing: Accommodation;
}

export function ListingCard({ listing }: ListingCardProps) {
  const firstPhoto = listing.photos?.[0] ?? null;

  return (
    <Link href={`/accommodation/${listing.id}`} className="block">
      <article className="rounded-xl border border-border bg-card shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        {/* Photo */}
        <div className="relative aspect-[4/3] w-full bg-muted">
          {firstPhoto ? (
            <Image
              src={firstPhoto}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🏘️</div>
          )}
          {/* Status badge */}
          <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            listing.status === 'Available'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {listing.status}
          </span>
        </div>

        <div className="p-3">
          <h2 className="font-semibold text-foreground line-clamp-1 mb-1">{listing.title}</h2>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.neighbourhood}</span>
          </div>

          <p className="text-lg font-bold text-[#003087] mb-2">
            {formatCurrency(listing.price_per_month)}<span className="text-xs font-normal text-muted-foreground">/month</span>
          </p>

          <AmenitiesChips accommodation={listing} variant="compact" />
        </div>
      </article>
    </Link>
  );
}
