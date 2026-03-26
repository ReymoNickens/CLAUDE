import { createClient } from '@/lib/supabase/server';
import { FareRateEditor } from './FareRateEditor';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data: rates } = await supabase
    .from('fare_rates')
    .select('*')
    .order('vehicle_type');

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold">Fare Rates</h2>
      <p className="text-sm text-muted-foreground">
        Set the per-km rate and base fare for each vehicle type. Changes take effect immediately for all new ride requests.
      </p>

      <div className="space-y-4">
        {(rates ?? []).map((rate) => (
          <FareRateEditor key={rate.id} rate={rate} />
        ))}
        {(!rates || rates.length === 0) && (
          <p className="text-sm text-muted-foreground">No fare rates configured. Check that the seed data ran correctly.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Commission</p>
        <p className="text-sm">Platform commission is fixed at <strong>10%</strong> of fare amount and cannot be changed here. Contact the development team to modify commission rates.</p>
      </div>
    </div>
  );
}
