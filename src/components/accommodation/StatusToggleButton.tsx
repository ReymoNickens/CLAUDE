'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ListingStatus } from '@/types';

interface StatusToggleButtonProps {
  listingId: string;
  initialStatus: ListingStatus;
}

export function StatusToggleButton({ listingId, initialStatus }: StatusToggleButtonProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<ListingStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next: ListingStatus = status === 'Available' ? 'Taken' : 'Available';
    setStatus(next);
    startTransition(async () => {
      const { error } = await supabase
        .from('accommodations')
        .update({ status: next })
        .eq('id', listingId);
      if (error) setStatus(status); // revert on error
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
        status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
      }`}>
        {status === 'Available' ? '✓ Available' : '✗ Taken'}
      </span>
      <button
        onClick={toggle}
        disabled={isPending}
        className="text-xs text-[#003087] underline disabled:opacity-50"
      >
        Mark as {status === 'Available' ? 'Taken' : 'Available'}
      </button>
    </div>
  );
}
