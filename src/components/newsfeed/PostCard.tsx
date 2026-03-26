import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { CategoryBadge } from './CategoryFilter';
import { LikeButton } from './LikeButton';
import type { PostWithProfile } from '@/types';

interface PostCardProps {
  post: PostWithProfile;
  commentCount: number;
  isLiked: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

export function PostCard({ post, commentCount, isLiked }: PostCardProps) {
  const author = post.profiles;

  return (
    <article className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Photo (if present) */}
      {post.photo_url && (
        <Link href={`/newsfeed/${post.id}`} className="block">
          <div className="relative aspect-[16/9] w-full bg-muted">
            <Image
              src={post.photo_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
        </Link>
      )}

      <div className="p-4">
        {/* Category + time */}
        <div className="mb-2 flex items-center justify-between">
          <CategoryBadge category={post.category} />
          <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
            {timeAgo(post.created_at)}
          </time>
        </div>

        {/* Title */}
        <Link href={`/newsfeed/${post.id}`}>
          <h2 className="mb-1 font-semibold leading-snug text-foreground hover:text-[#003087] transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Body preview */}
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{post.body}</p>

        {/* Footer: author + actions */}
        <div className="flex items-center justify-between">
          {/* Author */}
          <Link href={`/newsfeed/${post.id}`} className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003087] text-xs font-bold text-white">
              {author.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-medium text-foreground">
                  {author.full_name}
                </span>
                {author.is_verified && <VerifiedBadge />}
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LikeButton
              postId={post.id}
              initialCount={post.likes_count}
              initialLiked={isLiked}
            />
            <Link
              href={`/newsfeed/${post.id}#comments`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`${commentCount} comments`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
