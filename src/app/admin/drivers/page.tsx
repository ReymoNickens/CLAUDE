import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/currency';
import { DriverActions } from './DriverActions';

export const dynamic = 'force-dynamic';

export default async function AdminDriversPage() {
  const supabase = createClient();

  const { data: drivers } = await supabase
    .from('drivers')
    .select(`
      id, vehicle_type, plate_number, status, is_online,
      rating, total_trips, total_earnings, commission_owed,
      profiles(full_name, phone)
    `)
    .order('status');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Drivers</h2>

      <div className="space-y-3">
        {(drivers ?? []).map((d) => {
          const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
          return (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{profile?.full_name ?? '—'}</p>
                    <StatusBadge status={d.status} />
                    {d.is_online && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Online</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile?.phone ?? '—'} · {d.vehicle_type === 'Car' ? '🚗' : '🛺'} {d.vehicle_type} · {d.plate_number ?? 'No plate'}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>⭐ {d.rating.toFixed(1)}</span>
                    <span>{d.total_trips} trips</span>
                    <span>Earned: {formatCurrency(d.total_earnings)}</span>
                    {d.commission_owed > 0 && (
                      <span className="text-amber-600 font-medium">Owes: {formatCurrency(d.commission_owed)}</span>
                    )}
                  </div>
                </div>
                <DriverActions driverId={d.id} currentStatus={d.status} commissionOwed={d.commission_owed} />
              </div>
            </div>
          );
        })}
        {!drivers?.length && (
          <p className="py-12 text-center text-muted-foreground">No drivers registered yet.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}
