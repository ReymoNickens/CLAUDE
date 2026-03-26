'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ContentActions({ postId }: { postId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<'unflag' | 'delete' | null>(null);

  async function unflag() {
    setLoading('unflag');
    await supabase.from('posts').update({ is_flagged: false }).eq('id', postId);
    setLoading(null);
    router.refresh();
  }

  async function deletePost() {
    setLoading('delete');
    await supabase.from('posts').delete().eq('id', postId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        onClick={unflag}
        disabled={!!loading}
        className="rounded-lg bg-white border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {loading === 'unflag' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Unflag'}
      </button>
      <button
        onClick={deletePost}
        disabled={!!loading}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading === 'delete' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
      </button>
    </div>
  );
}
