'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface FareRate {
  id: string;
  vehicle_type: string;
  price_per_km: number;
  base_fare: number;
  updated_at: string;
}

export function FareRateEditor({ rate }: { rate: FareRate }) {
  const router = useRouter();
  const supabase = createClient();

  const [pricePerKm, setPricePerKm] = useState(rate.price_per_km.toString());
  const [baseFare, setBaseFare] = useState(rate.base_fare.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const exampleFare = parseFloat(baseFare || '0') + 5 * parseFloat(pricePerKm || '0');

  async function save() {
    setSaving(true);
    await supabase
      .from('fare_rates')
      .update({
        price_per_km: parseFloat(pricePerKm),
        base_fare: parseFloat(baseFare),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rate.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const isDirty = pricePerKm !== rate.price_per_km.toString() || baseFare !== rate.base_fare.toString();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{rate.vehicle_type === 'Car' ? '🚗' : '🛺'}</span>
        <h3 className="font-semibold">{rate.vehicle_type}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Rate per km (GH₵)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Base fare (GH₵)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={baseFare}
            onChange={(e) => setBaseFare(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          5 km example: <strong>{isNaN(exampleFare) ? '—' : formatCurrency(exampleFare)}</strong>
        </p>
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="flex items-center gap-1.5 rounded-lg bg-[#003087] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <><Check className="h-3 w-3" /> Saved</>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  );
}
