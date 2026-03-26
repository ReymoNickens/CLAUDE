'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { RideRequestState } from '@/store/rideStore';

interface RideStatusBarProps {
  state: RideRequestState;
  onCancel?: () => void;
}

const STATUS_CONFIG: Record<
  RideRequestState,
  { label: string; sublabel: string; color: string; showCancel: boolean; icon: 'spinner' | 'check' | 'x' | null }
> = {
  idle: { label: '', sublabel: '', color: '', showCancel: false, icon: null },
  requesting: { label: 'Finding a driver…', sublabel: 'Please wait', color: 'bg-blue-50 border-blue-200', showCancel: true, icon: 'spinner' },
  waiting_driver: { label: 'Waiting for driver to accept', sublabel: 'This may take up to 30 seconds', color: 'bg-amber-50 border-amber-200', showCancel: true, icon: 'spinner' },
  accepted: { label: 'Driver is on the way!', sublabel: 'Your driver has accepted the ride', color: 'bg-green-50 border-green-200', showCancel: false, icon: 'check' },
  in_progress: { label: 'Ride in progress', sublabel: 'You are on your way', color: 'bg-blue-50 border-blue-200', showCancel: false, icon: 'spinner' },
  completed: { label: 'Ride completed', sublabel: 'Hope you had a great ride!', color: 'bg-green-50 border-green-200', showCancel: false, icon: 'check' },
  cancelled: { label: 'Ride cancelled', sublabel: 'Your ride was cancelled', color: 'bg-red-50 border-red-200', showCancel: false, icon: 'x' },
};

export function RideStatusBar({ state, onCancel }: RideStatusBarProps) {
  if (state === 'idle') return null;

  const config = STATUS_CONFIG[state];

  return (
    <div className={`rounded-xl border p-3 ${config.color}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {config.icon === 'spinner' && <Loader2 className="h-5 w-5 animate-spin text-[#003087]" />}
          {config.icon === 'check' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {config.icon === 'x' && <XCircle className="h-5 w-5 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.sublabel}</p>
        </div>
        {config.showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
