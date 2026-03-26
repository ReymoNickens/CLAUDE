import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { status?: string; page?: string };
}

const STATUSES = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
const PAGE_SIZE = 20;

export default async function AdminRidesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const status = searchParams.status ?? 'all';
  const page = parseInt(searchParams.page ?? '1') - 1;

  let query = supabase
    .from('rides')
    .select(`
      id, status, vehicle_type, fare_amount, commission_amount, driver_earnings,
      pickup_address, dest_address, distance_km, payment_method,
      requested_at, completed_at, cancelled_at
    `, { count: 'exact' })
    .order('requested_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (status !== 'all') query = query.eq('status', status);

  const { data: rides, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Rides</h2>
        <span className="text-sm text-muted-foreground">{count ?? 0} total</span>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/rides?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === s ? 'bg-[#003087] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">From → To</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Fare</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Commission</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(rides ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2 max-w-[200px]">
                  <p className="truncate">{r.pickup_address ?? '?'}</p>
                  <p className="truncate text-muted-foreground">{r.dest_address ?? '?'}</p>
                </td>
                <td className="px-3 py-2 font-medium">{r.fare_amount ? formatCurrency(r.fare_amount) : '—'}</td>
                <td className="px-3 py-2 text-amber-600">{r.commission_amount ? formatCurrency(r.commission_amount) : '—'}</td>
                <td className="px-3 py-2">{r.vehicle_type === 'Car' ? '🚗' : '🛺'} {r.payment_method}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(r.requested_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
            {!rides?.length && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No rides found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/rides?status=${status}&page=${p}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                p === page + 1 ? 'bg-[#003087] text-white' : 'border border-border hover:bg-muted'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
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
