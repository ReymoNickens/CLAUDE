'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface DriverActionsProps {
  driverId: string;
  currentStatus: string;
  commissionOwed: number;
}

export function DriverActions({ driverId, currentStatus, commissionOwed }: DriverActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');

  async function setStatus(status: string) {
    setLoading(true);
    await supabase.from('drivers').update({ status }).eq('id', driverId);
    setLoading(false);
    router.refresh();
  }

  async function recordSettlement() {
    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) return;
    setSettling(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('commission_payments').insert({
      driver_id: driverId,
      amount,
      recorded_by: user?.id,
      note: 'Cash settlement',
    });
    setSettlementAmount('');
    setSettling(false);
    router.refresh();
  }

  return (
    <div className="shrink-0 flex flex-col gap-2 items-end">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="flex gap-1.5">
          {currentStatus === 'pending' && (
            <button
              onClick={() => setStatus('approved')}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {currentStatus === 'approved' && (
            <button
              onClick={() => setStatus('suspended')}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
            >
              Suspend
            </button>
          )}
          {currentStatus === 'suspended' && (
            <button
              onClick={() => setStatus('approved')}
              className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
            >
              Reinstate
            </button>
          )}
        </div>
      )}

      {commissionOwed > 0 && (
        <div className="flex gap-1 items-center mt-1">
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={commissionOwed}
            placeholder={`Max ${formatCurrency(commissionOwed)}`}
            value={settlementAmount}
            onChange={(e) => setSettlementAmount(e.target.value)}
            className="w-28 rounded-lg border border-input px-2 py-1 text-xs"
          />
          <button
            onClick={recordSettlement}
            disabled={settling || !settlementAmount}
            className="rounded-lg bg-[#003087] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {settling ? '…' : 'Settle'}
          </button>
        </div>
      )}
    </div>
  );
}
