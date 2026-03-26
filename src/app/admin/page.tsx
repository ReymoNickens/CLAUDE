import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [
    { count: userCount },
    { count: driverCount },
    { count: rideCount },
    { count: pendingDrivers },
    { data: commissionData },
    { count: flaggedPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('rides').select('commission_amount').eq('status', 'completed'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
  ]);

  const totalCommission = (commissionData ?? []).reduce(
    (sum, r) => sum + (r.commission_amount ?? 0),
    0
  );

  const stats = [
    { label: 'Total Users', value: (userCount ?? 0).toString(), icon: '👥' },
    { label: 'Approved Drivers', value: (driverCount ?? 0).toString(), icon: '🚗', badge: pendingDrivers ? `${pendingDrivers} pending` : null },
    { label: 'Completed Rides', value: (rideCount ?? 0).toString(), icon: '✅' },
    { label: 'Total Commission', value: formatCurrency(totalCommission), icon: '💰' },
    { label: 'Flagged Posts', value: (flaggedPosts ?? 0).toString(), icon: '🚩', badge: flaggedPosts ? 'needs review' : null },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Dashboard Overview</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              {s.badge && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent rides */}
      <RecentRides />
    </div>
  );
}

async function RecentRides() {
  const supabase = createClient();
  const { data: rides } = await supabase
    .from('rides')
    .select('id, status, fare_amount, vehicle_type, requested_at, pickup_address, dest_address')
    .order('requested_at', { ascending: false })
    .limit(10);

  return (
    <div>
      <h3 className="mb-3 font-semibold">Recent Rides</h3>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">From</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">To</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Fare</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(rides ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2 max-w-[120px] truncate text-xs">{r.pickup_address ?? '—'}</td>
                <td className="px-3 py-2 max-w-[120px] truncate text-xs">{r.dest_address ?? '—'}</td>
                <td className="px-3 py-2 text-xs font-medium">{r.fare_amount ? formatCurrency(r.fare_amount) : '—'}</td>
                <td className="px-3 py-2 text-xs">{r.vehicle_type === 'Car' ? '🚗' : '🛺'}</td>
              </tr>
            ))}
            {!rides?.length && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">No rides yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
