import { createClient } from '@/lib/supabase/server';
import { VerifyToggle } from './VerifyToggle';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { role?: string; q?: string };
}

const ROLES = ['all', 'student', 'driver', 'business_owner', 'landlord', 'admin'];

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const role = searchParams.role ?? 'all';
  const q = searchParams.q?.trim();

  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, role, is_verified, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  if (role !== 'all') query = query.eq('role', role);
  if (q) query = query.ilike('full_name', `%${q}%`);

  const { data: users, count } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Users</h2>
        <span className="text-sm text-muted-foreground">{count ?? 0} total</span>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className="rounded-lg bg-[#003087] px-4 text-sm font-medium text-white">Search</button>
      </form>

      {/* Role filter */}
      <div className="flex gap-1.5 flex-wrap">
        {ROLES.map((r) => (
          <a
            key={r}
            href={`/admin/users?role=${r}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              role === r ? 'bg-[#003087] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {r === 'all' ? 'All' : r.replace('_', ' ')}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Phone</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Role</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Verified</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(users ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{u.full_name}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{u.phone ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <VerifyToggle userId={u.id} isVerified={u.is_verified} />
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
