import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ServiceCard, CATEGORY_ICONS } from '@/components/services/ServiceCard';
import type { Service } from '@/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Services' };

const CATEGORIES = Object.keys(CATEGORY_ICONS);

interface PageProps {
  searchParams: { category?: string; q?: string };
}

export default async function ServicesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const category = searchParams.category;
  const q = searchParams.q?.trim();

  let query = supabase.from('services').select('*').order('avg_rating', { ascending: false });
  if (category) query = query.eq('category', category);
  if (q) query = query.ilike('name', `%${q}%`);

  const { data: services, error } = await query;

  const isFiltered = !!category || !!q;

  return (
    <div className="px-4 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 -mx-4 px-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#003087]">Local Services</h1>
            <p className="text-xs text-muted-foreground">Businesses near UCC campus</p>
          </div>
          {user && (
            <Link href="/services/new" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003087] text-white shadow-sm hover:bg-[#002070] transition-colors" aria-label="Add service">
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Search */}
        <form method="GET" action="/services" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Search services…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>

      {/* Category grid — shown when no filter active */}
      {!isFiltered && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Browse by Category</p>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/services?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center shadow-sm hover:border-[#003087] hover:bg-[#003087]/5 transition-colors"
              >
                <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-[11px] font-medium leading-tight">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isFiltered && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {services?.length ?? 0} result{services?.length !== 1 ? 's' : ''}
              {category ? ` in ${category}` : ''}
              {q ? ` for "${q}"` : ''}
            </p>
            <Link href="/services" className="text-xs text-[#003087] underline">Clear</Link>
          </div>

          <div className="space-y-2">
            {error && <p className="text-sm text-red-600">Failed to load services.</p>}
            {!error && services?.length === 0 && (
              <div className="py-12 text-center">
                <p className="font-medium">No services found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different search</p>
              </div>
            )}
            {services?.map((s) => (
              <ServiceCard key={s.id} service={s as unknown as Service} />
            ))}
          </div>
        </div>
      )}

      {/* Recent / top rated when browsing without filter */}
      {!isFiltered && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Rated</p>
          <div className="space-y-2">
            {error && <p className="text-sm text-red-600">Failed to load services.</p>}
            {services?.slice(0, 10).map((s) => (
              <ServiceCard key={s.id} service={s as unknown as Service} />
            ))}
            {!error && services?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No services listed yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
