import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/newsfeed/PostCard';
import { CategoryFilter } from '@/components/newsfeed/CategoryFilter';
import type { PostCategory, PostWithProfile } from '@/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Newsfeed' };

interface PageProps {
  searchParams: { category?: string };
}

export default async function NewsfeedPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const category = searchParams.category as PostCategory | undefined;

  // Fetch posts with author profiles
  let query = supabase
    .from('posts')
    .select('*, profiles(full_name, avatar_url, is_verified, role)')
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(40);

  if (category) {
    query = query.eq('category', category);
  }

  const { data: posts, error } = await query;

  // Fetch user's liked post IDs
  let likedIds = new Set<string>();
  if (user && posts && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);
    likedIds = new Set(likes?.map((l) => l.post_id) ?? []);
  }

  // Fetch comment counts in one query
  let commentCounts: Record<string, number> = {};
  if (posts && posts.length > 0) {
    const { data: counts } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', posts.map((p) => p.id));
    if (counts) {
      for (const row of counts) {
        commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="px-4 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 -mx-4 px-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#003087]">Campus Newsfeed</h1>
            <p className="text-xs text-muted-foreground">University of Cape Coast</p>
          </div>
          {user && (
            <Link
              href="/newsfeed/new"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003087] text-white shadow-sm hover:bg-[#002070] transition-colors"
              aria-label="Create post"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>
        {/* Category filter */}
        <Suspense>
          <CategoryFilter selected={category ?? null} />
        </Suspense>
      </div>

      {/* Feed */}
      <div className="mt-4 space-y-3">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load posts. Please try again.
          </div>
        )}

        {!error && posts?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <span className="text-2xl">📰</span>
            </div>
            <p className="font-medium text-foreground">No posts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {category ? `No ${category} posts found.` : 'Be the first to post something!'}
            </p>
            {user && (
              <Link
                href="/newsfeed/new"
                className="mt-4 rounded-xl bg-[#003087] px-5 py-2 text-sm font-semibold text-white hover:bg-[#002070] transition-colors"
              >
                Create Post
              </Link>
            )}
          </div>
        )}

        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post as unknown as PostWithProfile}
            commentCount={commentCounts[post.id] ?? 0}
            isLiked={likedIds.has(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
