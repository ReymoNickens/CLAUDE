'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
}

export function LikeButton({ postId, initialCount, initialLiked }: LikeButtonProps) {
  const supabase = createClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Revert if not logged in
        setLiked(liked);
        setCount(count);
        return;
      }

      if (nextLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) {
          setLiked(liked);
          setCount(count);
        }
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) {
          setLiked(liked);
          setCount(count);
        }
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={liked ? 'Unlike post' : 'Like post'}
      aria-pressed={liked}
      className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60"
    >
      <Heart
        className={`h-4 w-4 transition-transform active:scale-125 ${
          liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        }`}
      />
      <span className={liked ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
        {count}
      </span>
    </button>
  );
}
