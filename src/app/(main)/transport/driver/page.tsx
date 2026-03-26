'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Power, CheckCircle, XCircle, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { formatCurrency } from '@/lib/utils/currency';
import type { Driver, Profile, Ride } from '@/types';

type DriverProfile = Driver & Pick<Profile, 'full_name'>;

interface IncomingRide {
  id: string;
  pickup_address: string | null;
  dest_address: string | null;
  fare_amount: number | null;
  distance_km: number | null;
  vehicle_type: string;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [incomingRide, setIncomingRide] = useState<IncomingRide | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Update driver location while online
  useDriverLocation(driver?.id ?? null, driver?.is_online ?? false);

  // Load driver profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: profile }, { data: driverRow }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('drivers').select('*').eq('id', user.id).single(),
      ]);

      if (!driverRow || profile?.role !== 'driver') {
        router.push('/transport');
        return;
      }

      setDriver({ ...driverRow, full_name: profile.full_name } as unknown as DriverProfile);
      setLoading(false);
    })();
  }, [supabase, router]);

  // Subscribe to ride requests directed at this driver
  useEffect(() => {
    if (!driver?.id || !driver.is_online) return;

    channelRef.current = supabase
      .channel(`driver-rides-${driver.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${driver.id}`,
        },
        (payload) => {
          const ride = payload.new as IncomingRide;
          if (ride) {
            setIncomingRide(ride);
            startCountdown(ride.id);
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [driver?.id, driver?.is_online, supabase]);

  function startCountdown(rideId: string) {
    setCountdown(30);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          // Auto-decline: just clear the incoming ride
          setIncomingRide(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function toggleOnline() {
    if (!driver) return;
    if (driver.status !== 'approved') return;
    setToggling(true);
    const newState = !driver.is_online;
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: newState })
      .eq('id', driver.id);
    if (!error) setDriver((prev) => prev ? { ...prev, is_online: newState } : prev);
    setToggling(false);
  }

  async function acceptRide() {
    if (!incomingRide || !driver) return;
    clearInterval(countdownRef.current!);

    const { error } = await supabase
      .from('rides')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', incomingRide.id);

    if (!error) {
      setActiveRide({ ...incomingRide, status: 'accepted' } as unknown as Ride);
      setIncomingRide(null);
    }
  }

  async function declineRide() {
    if (!incomingRide) return;
    clearInterval(countdownRef.current!);
    await supabase
      .from('rides')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'Driver declined' })
      .eq('id', incomingRide.id);
    setIncomingRide(null);
  }

  async function startRide() {
    if (!activeRide) return;
    const { error } = await supabase
      .from('rides')
      .update({ status: 'in_progress' })
      .eq('id', activeRide.id);
    if (!error) setActiveRide((prev) => prev ? { ...prev, status: 'in_progress' } : prev);
  }

  async function completeRide() {
    if (!activeRide) return;
    const res = await fetch('/api/rides/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId: activeRide.id }),
    });
    if (res.ok) {
      setActiveRide(null);
      // Refresh driver stats
      const { data } = await supabase.from('drivers').select('*').eq('id', driver!.id).single();
      if (data) setDriver((prev) => prev ? { ...prev, ...data } : prev);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#003087]" />
      </div>
    );
  }

  if (!driver) return null;

  if (driver.status === 'pending') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold">Account Under Review</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your driver application is being reviewed by admin. You'll be notified once approved.</p>
      </div>
    );
  }

  if (driver.status === 'suspended') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-red-600">Account Suspended</h2>
        <p className="mt-2 text-sm text-muted-foreground">Contact admin to resolve your account status.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 -mx-4 px-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#003087]">Driver Dashboard</h1>
            <p className="text-xs text-muted-foreground">{driver.full_name}</p>
          </div>
          <button
            type="button"
            onClick={toggleOnline}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              driver.is_online
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {driver.is_online ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-[#003087]" />}
          label="Total Earnings"
          value={formatCurrency(driver.total_earnings)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-[#003087]" />}
          label="Total Trips"
          value={driver.total_trips.toString()}
        />
        <StatCard
          icon={<span className="text-base">⭐</span>}
          label="Rating"
          value={driver.rating.toFixed(1)}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-amber-500" />}
          label="Commission Owed"
          value={formatCurrency(driver.commission_owed)}
          valueClass={driver.commission_owed > 0 ? 'text-amber-600' : undefined}
        />
      </div>

      {/* Status indicator */}
      <div className={`rounded-xl border p-3 ${driver.is_online ? 'border-green-200 bg-green-50' : 'border-border bg-muted/50'}`}>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${driver.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <p className="text-sm font-medium">
            {driver.is_online ? 'You are online and accepting rides' : 'You are offline — toggle online to receive rides'}
          </p>
        </div>
      </div>

      {/* Incoming ride request */}
      {incomingRide && (
        <div className="rounded-xl border-2 border-[#003087] bg-[#003087]/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#003087]">New Ride Request!</h3>
            <span className="rounded-full bg-[#003087] px-2.5 py-0.5 text-xs font-bold text-white">{countdown}s</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Pickup:</span> {incomingRide.pickup_address ?? 'Unknown'}</p>
            <p><span className="font-medium">Drop-off:</span> {incomingRide.dest_address ?? 'Unknown'}</p>
            {incomingRide.distance_km && (
              <p><span className="font-medium">Distance:</span> {Number(incomingRide.distance_km).toFixed(1)} km</p>
            )}
            {incomingRide.fare_amount && (
              <p><span className="font-medium">Fare:</span> {formatCurrency(incomingRide.fare_amount)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={declineRide}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Decline
            </button>
            <button
              onClick={acceptRide}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#003087] py-3 text-sm font-semibold text-white hover:bg-[#002070] transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Active ride */}
      {activeRide && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <h3 className="font-bold text-green-700">Active Ride</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Pickup:</span> {activeRide.pickup_address ?? 'See map'}</p>
            <p><span className="font-medium">Drop-off:</span> {activeRide.dest_address ?? 'See map'}</p>
            {activeRide.fare_amount && (
              <p><span className="font-medium">Fare:</span> {formatCurrency(activeRide.fare_amount)}</p>
            )}
            <p className="text-xs text-muted-foreground">Payment: Cash — collect full fare from student</p>
          </div>
          <div className="flex gap-2">
            {activeRide.status === 'accepted' && (
              <button
                onClick={startRide}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#003087] py-3 text-sm font-semibold text-white"
              >
                Start Ride
              </button>
            )}
            {activeRide.status === 'in_progress' && (
              <button
                onClick={completeRide}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Ride
              </button>
            )}
          </div>
        </div>
      )}

      {/* No activity */}
      {!incomingRide && !activeRide && driver.is_online && (
        <div className="py-12 text-center text-muted-foreground">
          <div className="mx-auto mb-3 text-4xl">🛺</div>
          <p className="font-medium">Waiting for ride requests…</p>
          <p className="mt-1 text-xs">Stay online to receive requests</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${valueClass ?? 'text-foreground'}`}>{value}</p>
    </div>
  );
}
