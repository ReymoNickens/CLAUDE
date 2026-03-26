'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_ICONS } from '@/components/services/ServiceCard';

const CATEGORIES = Object.keys(CATEGORY_ICONS);

interface PhotoEntry { file: File; preview: string }

export default function NewServicePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!category) { setError('Please select a category.'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const photoUrls: string[] = [];
      for (const entry of photos) {
        const ext = entry.file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('service-photos')
          .upload(path, entry.file, { contentType: entry.file.type });
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from('service-photos').getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      const { data: newService, error: insertErr } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          name: name.trim(),
          category,
          description: description.trim() || null,
          location: location.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          opening_hours: openingHours.trim() || null,
          photos: photoUrls,
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message);
      router.push(`/services/${newService.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3 border-b border-border">
        <Link href="/services" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm">Add Service</h1>
        <button
          form="service-form"
          type="submit"
          disabled={loading || !name || !category}
          className="rounded-lg bg-[#003087] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
        </button>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Name */}
        <Field label="Business Name *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kwame's Print Shop"
            required
            maxLength={100}
            className="input-base"
          />
        </Field>

        {/* Category */}
        <Field label="Category *">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors ${
                  category === cat
                    ? 'border-[#003087] bg-[#003087]/5 text-[#003087]'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-[10px] font-medium leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Location */}
        <Field label="Location / Address">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Near UCC Main Gate"
            className="input-base"
          />
        </Field>

        {/* Opening hours */}
        <Field label="Opening Hours">
          <input
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="e.g. Mon–Sat 8am–6pm"
            className="input-base"
          />
        </Field>

        {/* Phone */}
        <Field label="Phone Number">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0244 123 456"
            className="input-base"
          />
        </Field>

        {/* WhatsApp */}
        <Field label="WhatsApp Number">
          <input
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="0244 123 456"
            className="input-base"
          />
        </Field>

        {/* Photos */}
        <Field label={`Photos (${photos.length}/5)`}>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image src={p.preview} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-[#003087] hover:text-[#003087] transition-colors"
              >
                <Camera className="h-6 w-6" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your services, specialties, etc."
            className="input-base resize-none"
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </form>

      <style jsx global>{`
        .input-base {
          display: flex; width: 100%; border-radius: 0.375rem;
          border: 1px solid hsl(var(--input)); background: hsl(var(--background));
          padding: 0.5rem 0.75rem; font-size: 0.875rem;
          outline: none;
        }
        .input-base:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }
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
