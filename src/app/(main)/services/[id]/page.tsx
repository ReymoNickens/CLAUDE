import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StarRating } from '@/components/services/StarRating';
import { ReviewsSection } from '@/components/services/ReviewsSection';
import { CATEGORY_ICONS } from '@/components/services/ServiceCard';
import { whatsappLink } from '@/lib/utils/phone';
import type { Service, ServiceReview, Profile } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('services').select('name').eq('id', params.id).single();
  return { title: data?.name ?? 'Service' };
}

type ReviewWithProfile = ServiceReview & {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

export default async function ServiceDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !service) notFound();

  const s = service as unknown as Service;

  const [{ data: reviews }, { data: userReview }] = await Promise.all([
    supabase
      .from('service_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('service_id', params.id)
      .order('created_at', { ascending: false }),
    user
      ? supabase
          .from('service_reviews')
          .select('id')
          .eq('service_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isOwner = user?.id === s.user_id;
  const hasReviewed = !!userReview;
  const canReview = !!user && !hasReviewed && !isOwner;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background px-4 py-3 border-b border-border">
        <Link href="/services" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm truncate flex-1">{s.name}</h1>
        {isOwner && (
          <Link href={`/services/${s.id}/edit`} className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors">
            Edit
          </Link>
        )}
      </div>

      {/* Photos */}
      {s.photos && s.photos.length > 0 ? (
        <div className="relative h-52 w-full overflow-hidden bg-muted">
          <Image src={s.photos[0]} alt={s.name} fill className="object-cover" sizes="100vw" priority />
          {s.photos.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              1 / {s.photos.length}
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted text-5xl">
          {CATEGORY_ICONS[s.category] ?? '🏪'}
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">{s.name}</h2>
            <p className="text-sm font-medium text-[#003087]">{s.category}</p>
          </div>
          <div className="shrink-0 text-right">
            <StarRating value={s.avg_rating} size="md" />
            <p className="mt-0.5 text-xs text-muted-foreground">{s.review_count} review{s.review_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          {s.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-[#003087]" />
              <span>{s.location}</span>
            </div>
          )}
          {s.opening_hours && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-[#003087]" />
              <span>{s.opening_hours}</span>
            </div>
          )}
          {s.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-[#003087]" />
              <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
            </div>
          )}
        </div>

        {s.description && (
          <p className="text-sm text-foreground leading-relaxed">{s.description}</p>
        )}

        {/* CTA buttons */}
        {(s.whatsapp || s.phone) && (
          <div className="flex gap-2">
            {s.whatsapp && (
              <a
                href={whatsappLink(s.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {s.phone && (
              <a
                href={`tel:${s.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
          </div>
        )}

        {/* Reviews */}
        <ReviewsSection
          serviceId={s.id}
          initialReviews={(reviews ?? []) as unknown as ReviewWithProfile[]}
          hasReviewed={!canReview}
          canReview={canReview}
        />
      </div>
    </div>
  );
}
