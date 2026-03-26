import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { VerifiedBadge } from '@/components/newsfeed/VerifiedBadge';
import { CategoryBadge } from '@/components/newsfeed/CategoryFilter';
import { LikeButton } from '@/components/newsfeed/LikeButton';
import { CommentSection } from '@/components/newsfeed/CommentSection';
import type { PostWithProfile } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('posts')
    .select('title')
    .eq('id', params.id)
    .single();
  return { title: data?.title ?? 'Post' };
}

export default async function PostDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch post with author
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name, avatar_url, is_verified, role)')
    .eq('id', params.id)
    .eq('is_flagged', false)
    .single();

  if (error || !post) notFound();

  // Fetch comments with authors
  const { data: comments } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, body, created_at, profiles(full_name, avatar_url, is_verified)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true });

  // Check if current user liked this post
  let isLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', params.id)
      .eq('user_id', user.id)
      .single();
    isLiked = !!like;
  }

  const author = (post as unknown as PostWithProfile).profiles;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GH', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Back navigation */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background px-4 py-3 border-b border-border">
        <Link
          href="/newsfeed"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Back to newsfeed"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-sm text-foreground truncate">{post.title}</h1>
      </div>

      <article className="px-4 py-4">
        {/* Category */}
        <div className="mb-3">
          <CategoryBadge category={post.category} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-3 leading-snug">{post.title}</h2>

        {/* Author + time */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#003087] text-sm font-bold text-white">
            {author.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{author.full_name}</span>
              {author.is_verified && <VerifiedBadge />}
            </div>
            <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
              {timeAgo(post.created_at)}
            </time>
          </div>
        </div>

        {/* Photo */}
        {post.photo_url && (
          <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={post.photo_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              priority
            />
          </div>
        )}

        {/* Body */}
        <div className="prose prose-sm max-w-none mb-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Like row */}
        <div className="flex items-center gap-4 py-3 border-t border-b border-border mb-4">
          <LikeButton
            postId={post.id}
            initialCount={post.likes_count}
            initialLiked={isLiked}
          />
        </div>

        {/* Comments */}
        <CommentSection
          postId={post.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialComments={(comments ?? []).map((c: any) => ({
            ...c,
            profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
          }))}
          currentUserId={user?.id ?? null}
        />
      </article>
    </div>
  );
}
