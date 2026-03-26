import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/drivers', label: 'Drivers' },
  { href: '/admin/rides', label: 'Rides' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/settings', label: 'Fare Rates' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/newsfeed');

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-[#003087]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold text-white">CampusConnect Admin</h1>
          <Link href="/newsfeed" className="rounded-lg border border-white/30 px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors">
            ← App
          </Link>
        </div>
        <nav className="flex overflow-x-auto px-4 pb-0 gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
