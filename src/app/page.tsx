export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/newsfeed');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#003087] px-6 text-white">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFD700] text-3xl font-black text-[#003087]">
          CC
        </div>
        <h1 className="text-3xl font-bold tracking-tight">CampusConnect UCC</h1>
        <p className="text-center text-sm text-blue-200">
          News · Housing · Services · Transport
        </p>
      </div>

      <p className="mb-10 max-w-xs text-center text-base text-blue-100">
        Your all-in-one campus companion for the University of Cape Coast community.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="flex h-12 items-center justify-center rounded-xl bg-[#FFD700] font-semibold text-[#003087] transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="flex h-12 items-center justify-center rounded-xl border border-white/30 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Create Account
        </Link>
      </div>

      <p className="mt-8 text-xs text-blue-300">University of Cape Coast, Ghana</p>
    </main>
  );
}
