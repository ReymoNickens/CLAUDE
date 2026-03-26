import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ContentActions } from './ContentActions';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const supabase = createClient();

  const { data: flaggedPosts } = await supabase
    .from('posts')
    .select('id, title, body, photo_url, category, likes_count, created_at, profiles(full_name)')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Flagged Content</h2>
        <span className="text-sm text-muted-foreground">{flaggedPosts?.length ?? 0} flagged</span>
      </div>

      {(!flaggedPosts || flaggedPosts.length === 0) && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium">No flagged content</p>
          <p className="text-sm mt-1">All clear!</p>
        </div>
      )}

      <div className="space-y-3">
        {(flaggedPosts ?? []).map((post) => {
          const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          return (
            <div key={post.id} className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {profile?.full_name ?? 'Unknown'} ·{' '}
                    {new Date(post.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })} ·{' '}
                    {post.category}
                  </p>
                </div>
                <ContentActions postId={post.id} />
              </div>

              <p className="text-sm line-clamp-3">{post.body}</p>

              {post.photo_url && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg">
                  <Image src={post.photo_url} alt="Post photo" fill className="object-cover" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
