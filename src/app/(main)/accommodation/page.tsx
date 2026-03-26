import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ListingCard } from '@/components/accommodation/ListingCard';
import type { Accommodation } from '@/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Accommodation' };

const UCC_NEIGHBOURHOODS = [
  'Amamoma', 'Abura', 'Pedu', 'Kotokuraba', 'Tantri',
  'Ayensudo', 'Ewim', 'University Avenue', 'Cape Coast',
];

interface PageProps {
  searchParams: {
    neighbourhood?: string;
    min?: string;
    max?: string;
    amenity?: string;
  };
}

export default async function AccommodationPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const neighbourhood = searchParams.neighbourhood;
  const min = searchParams.min ? Number(searchParams.min) : null;
  const max = searchParams.max ? Number(searchParams.max) : null;
  const amenity = searchParams.amenity;

  let query = supabase
    .from('accommodations')
    .select('*')
    .order('created_at', { ascending: false });

  if (neighbourhood) query = query.eq('neighbourhood', neighbourhood);
  if (min !== null) query = query.gte('price_per_month', min);
  if (max !== null) query = query.lte('price_per_month', max);
  if (amenity === 'wifi') query = query.eq('has_wifi', true);
  if (amenity === 'water') query = query.eq('has_water', true);
  if (amenity === 'electricity') query = query.eq('has_electricity', true);
  if (amenity === 'security') query = query.eq('has_security', true);
  if (amenity === 'self_contained') query = query.eq('is_self_contained', true);

  const { data: listings, error } = await query;

  const activeFilters = [neighbourhood, min !== null ? `GH₵${min}+` : null, max !== null ? `up to GH₵${max}` : null, amenity].filter(Boolean);

  return (
    <div className="px-4 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 -mx-4 px-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#003087]">Accommodation</h1>
            <p className="text-xs text-muted-foreground">Rooms & hostels near UCC</p>
          </div>
          {user && ['landlord', 'admin'].includes('landlord') && (
            <Link
              href="/accommodation/new"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003087] text-white shadow-sm hover:bg-[#002070] transition-colors"
              aria-label="Post listing"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Filters row */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterLink href="/accommodation" label="All" active={!neighbourhood && !min && !max && !amenity} />
          {UCC_NEIGHBOURHOODS.map((n) => (
            <FilterLink key={n} href={`/accommodation?neighbourhood=${encodeURIComponent(n)}`} label={n} active={neighbourhood === n} />
          ))}
        </div>

        {/* Price + amenity quick filters */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterLink href={`/accommodation?${neighbourhood ? `neighbourhood=${neighbourhood}&` : ''}max=500`} label="Under GH₵500" active={max === 500} small />
          <FilterLink href={`/accommodation?${neighbourhood ? `neighbourhood=${neighbourhood}&` : ''}min=500&max=1000`} label="GH₵500–1000" active={min === 500 && max === 1000} small />
          <FilterLink href={`/accommodation?${neighbourhood ? `neighbourhood=${neighbourhood}&` : ''}min=1000`} label="GH₵1000+" active={min === 1000 && !max} small />
          <FilterLink href={`/accommodation?${neighbourhood ? `neighbourhood=${neighbourhood}&` : ''}amenity=wifi`} label="📶 WiFi" active={amenity === 'wifi'} small />
          <FilterLink href={`/accommodation?${neighbourhood ? `neighbourhood=${neighbourhood}&` : ''}amenity=self_contained`} label="🏠 Self-contained" active={amenity === 'self_contained'} small />
        </div>
      </div>

      {/* Results count */}
      {activeFilters.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''} found
          <Link href="/accommodation" className="ml-2 text-[#003087] underline">Clear filters</Link>
        </p>
      )}

      {/* Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {error && (
          <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load listings.
          </div>
        )}

        {!error && listings?.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 text-4xl">🏘️</span>
            <p className="font-medium">No listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try different filters</p>
            <Link href="/accommodation" className="mt-3 text-sm text-[#003087] underline">Clear filters</Link>
          </div>
        )}

        {listings?.map((listing) => (
          <ListingCard key={listing.id} listing={listing as unknown as Accommodation} />
        ))}
      </div>
    </div>
  );
}

function FilterLink({ href, label, active, small = false }: { href: string; label: string; active: boolean; small?: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1 font-medium transition-colors ${small ? 'text-[11px]' : 'text-xs'} ${
        active
          ? 'bg-[#003087] text-white border-[#003087]'
          : 'bg-background text-muted-foreground border-border hover:bg-muted'
      }`}
    >
      {label}
    </Link>
  );
}
