'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import type { PostCategory } from '@/types';

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('General');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES: PostCategory[] = ['Academic', 'Events', 'Lost & Found', 'General', 'Urgent'];

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,          // 200 KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setError('Failed to process image. Please try another.');
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      let photoUrl: string | null = null;

      // Upload photo if selected
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('post-photos')
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from('post-photos')
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Insert post
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          body: body.trim(),
          category,
          photo_url: photoUrl,
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);

      router.push(`/newsfeed/${newPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3 border-b border-border">
        <Link
          href="/newsfeed"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Discard and go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm">New Post</h1>
        <button
          form="post-form"
          type="submit"
          disabled={!title.trim() || !body.trim() || loading}
          className="rounded-lg bg-[#003087] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
        </button>
      </div>

      <form id="post-form" onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Category */}
        <div>
          <p className="mb-2 text-sm font-medium">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#003087] text-white border-[#003087]'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this about?"
            maxLength={120}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{title.length}/120</p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="mb-1.5 block text-sm font-medium">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share what's happening on campus…"
            rows={5}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Photo */}
        <div>
          <p className="mb-2 text-sm font-medium">Photo (optional)</p>

          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted">
              <Image
                src={photoPreview}
                alt="Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground hover:border-[#003087] hover:text-[#003087] transition-colors"
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">Add photo</span>
              <span className="text-xs">Compressed to ≤200 KB automatically</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
