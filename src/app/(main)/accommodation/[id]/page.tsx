import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ListingGallery } from '@/components/accommodation/ListingGallery';
import { AmenitiesChips } from '@/components/accommodation/AmenitiesChips';
import { StatusToggleButton } from '@/components/accommodation/StatusToggleButton';
import { formatCurrency } from '@/lib/utils/currency';
import { whatsappLink } from '@/lib/utils/phone';
import type { Accommodation } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps { params: { id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('accommodations').select('title').eq('id', params.id).single();
  return { title: data?.title ?? 'Listing' };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from('accommodations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !listing) notFound();
  const l = listing as unknown as Accommodation;
  const isOwner = user?.id === l.user_id;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Back bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background px-4 py-3 border-b border-border">
        <Link href="/accommodation" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm truncate flex-1">{l.title}</h1>
        {isOwner && (
          <Link href={`/accommodation/new?edit=${l.id}`} className="text-xs text-[#003087] font-medium hover:underline shrink-0">
            Edit
          </Link>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5">
        <ListingGallery photos={l.photos ?? []} title={l.title} />

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{l.title}</h2>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{l.neighbourhood}</span>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-xl font-bold text-[#003087]">{formatCurrency(l.price_per_month)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>

        {/* Status */}
        {isOwner ? (
          <StatusToggleButton listingId={l.id} initialStatus={l.status} />
        ) : (
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
            l.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}>
            {l.status === 'Available' ? '✓ Available' : '✗ Taken'}
          </span>
        )}

        {l.description && (
          <div>
            <h3 className="text-sm font-semibold mb-1">About this place</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{l.description}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-2">Amenities</h3>
          <AmenitiesChips accommodation={l} variant="full" />
        </div>

        {/* Contact card */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Contact Landlord</h3>
          <a
            href={whatsappLink(l.whatsapp_number, `Hi, I'm interested in your listing: ${l.title}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors"
          >
            <WhatsAppIcon />
            Chat on WhatsApp
          </a>
          <a
            href={`tel:${l.whatsapp_number}`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Phone className="h-4 w-4" />
            {l.whatsapp_number}
          </a>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
