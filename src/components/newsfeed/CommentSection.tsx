'use client';

import { useState, useOptimistic, useRef } from 'react';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { VerifiedBadge } from './VerifiedBadge';
import type { PostComment, Profile } from '@/types';

interface CommentWithAuthor extends PostComment {
  profiles: Pick<Profile, 'full_name' | 'avatar_url' | 'is_verified'>;
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommentSection({ postId, initialComments, currentUserId }: CommentSectionProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setError(null);
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be signed in to comment.');
      setSubmitting(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, is_verified')
      .eq('id', user.id)
      .single();

    const { data, error: insertError } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: user.id, body: body.trim() })
      .select('id, post_id, user_id, body, created_at')
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      const newComment: CommentWithAuthor = {
        ...data,
        profiles: {
          full_name: profileData?.full_name ?? 'You',
          avatar_url: profileData?.avatar_url ?? null,
          is_verified: profileData?.is_verified ?? false,
        },
      };
      setComments((prev) => [...prev, newComment]);
      setBody('');
    }
  }

  return (
    <section id="comments" className="mt-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {/* Comment list */}
      <div className="space-y-3 mb-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003087] text-xs font-bold text-white">
              {comment.profiles.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 rounded-xl bg-muted px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-semibold">{comment.profiles.full_name}</span>
                {comment.profiles.is_verified && <VerifiedBadge className="h-3 w-3" />}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {timeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003087] text-white disabled:opacity-50 transition-opacity"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/login" className="text-[#003087] font-medium hover:underline">Sign in</a> to comment.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
