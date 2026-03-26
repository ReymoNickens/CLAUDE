'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { normaliseGhanaPhone, isValidGhanaPhone } from '@/lib/utils/phone';

const NEIGHBOURHOODS = [
  'Amamoma', 'Abura', 'Pedu', 'Kotokuraba', 'Tantri',
  'Ayensudo', 'Ewim', 'University Avenue', 'Cape Coast', 'Other',
];

const AMENITIES = [
  { key: 'has_water',         label: '💧 Water' },
  { key: 'has_electricity',   label: '⚡ Electricity' },
  { key: 'has_wifi',          label: '📶 WiFi' },
  { key: 'has_security',      label: '🔒 Security' },
  { key: 'is_self_contained', label: '🏠 Self-contained' },
];

interface PhotoEntry { file: File; preview: string }

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(key: string) {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    const entries: PhotoEntry[] = [];
    for (const file of files) {
      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
      entries.push({ file: compressed, preview: URL.createObjectURL(compressed) });
    }
    setPhotos((prev) => [...prev, ...entries]);
    e.target.value = '';
  }

  function removePhoto(i: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i]!.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate phone
    let normPhone: string;
    try {
      normPhone = normaliseGhanaPhone(whatsapp);
    } catch {
      setError('Enter a valid Ghana WhatsApp number.');
      return;
    }
    if (!isValidGhanaPhone(normPhone)) { setError('Invalid Ghana phone number.'); return; }
    if (!neighbourhood) { setError('Please select a neighbourhood.'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Upload photos
      const photoUrls: string[] = [];
      for (const entry of photos) {
        const ext = entry.file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('accommodation-photos').upload(path, entry.file, { contentType: entry.file.type });
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from('accommodation-photos').getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      const { data: newListing, error: insertErr } = await supabase
        .from('accommodations')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          price_per_month: parseFloat(price),
          neighbourhood,
          whatsapp_number: normPhone,
          photos: photoUrls,
          has_water: !!amenities['has_water'],
          has_electricity: !!amenities['has_electricity'],
          has_wifi: !!amenities['has_wifi'],
          has_security: !!amenities['has_security'],
          is_self_contained: !!amenities['is_self_contained'],
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message);
      router.push(`/accommodation/${newListing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3 border-b border-border">
        <Link href="/accommodation" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm">New Listing</h1>
        <button form="listing-form" type="submit" disabled={loading || !title || !price || !neighbourhood || !whatsapp}
          className="rounded-lg bg-[#003087] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
        </button>
      </div>

      <form id="listing-form" onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Title */}
        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Furnished single room in Amamoma" required maxLength={100}
            className="input-base" />
        </Field>

        {/* Price */}
        <Field label="Price per month (GH₵) *">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">GH₵</span>
            <input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" required
              className="input-base pl-12" />
          </div>
        </Field>

        {/* Neighbourhood */}
        <Field label="Neighbourhood *">
          <div className="flex flex-wrap gap-2">
            {NEIGHBOURHOODS.map((n) => (
              <button key={n} type="button" onClick={() => setNeighbourhood(n)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${neighbourhood === n ? 'bg-[#003087] text-white border-[#003087]' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                {n}
              </button>
            ))}
          </div>
        </Field>

        {/* WhatsApp */}
        <Field label="WhatsApp Number *">
          <input type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0244 123 456" required
            className="input-base" />
          <p className="mt-1 text-xs text-muted-foreground">Students will contact you via WhatsApp</p>
        </Field>

        {/* Amenities */}
        <Field label="Amenities">
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => toggleAmenity(key)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${amenities[key] ? 'border-[#003087] bg-[#003087]/5 text-[#003087] font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                <span className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${amenities[key] ? 'bg-[#003087] border-[#003087]' : 'border-muted-foreground'}`}>
                  {amenities[key] && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* Photos */}
        <Field label={`Photos (${photos.length}/5)`}>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image src={p.preview} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-[#003087] hover:text-[#003087] transition-colors">
                <Camera className="h-6 w-6" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Describe the room, location, rules, etc."
            className="input-base resize-none" />
        </Field>

        {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

      <style jsx global>{`
        .input-base {
          display: flex; width: 100%; border-radius: 0.375rem;
          border: 1px solid hsl(var(--input)); background: hsl(var(--background));
          padding: 0.5rem 0.75rem; font-size: 0.875rem;
          outline: none;
        }
        .input-base:focus { ring: 2px; ring-color: hsl(var(--ring)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
