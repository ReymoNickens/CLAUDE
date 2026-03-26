'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function VerifyToggle({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(isVerified);

  async function toggle() {
    setLoading(true);
    const next = !value;
    await supabase.from('profiles').update({ is_verified: next }).eq('id', userId);
    setValue(next);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        value ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {value ? '✓ Verified' : 'Unverified'}
    </button>
  );
}
