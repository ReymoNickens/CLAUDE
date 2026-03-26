import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Transport' };

export default function TransportPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      {/* Map placeholder */}
      <div className="flex-1 bg-slate-200 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#003087]/10">
            <svg className="h-8 w-8 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium text-[#003087]">UCC Campus Map</p>
          <p className="text-xs">Google Maps loads here — Sprint 5</p>
        </div>
      </div>

      {/* Booking panel */}
      <div className="rounded-t-2xl border-t border-border bg-background p-4 shadow-lg">
        <h2 className="mb-3 text-lg font-bold text-[#003087]">Book a Ride</h2>

        <div className="space-y-2">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted px-3">
            <div className="h-2 w-2 rounded-full bg-[#003087]" />
            <span className="text-sm text-muted-foreground">Set pickup location…</span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted px-3">
            <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
            <span className="text-sm text-muted-foreground">Set destination…</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {['Car', 'Pragya'].map((type) => (
            <button
              key={type}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition-colors hover:border-[#003087] hover:text-[#003087]"
            >
              <span>{type === 'Car' ? '🚗' : '🛺'}</span>
              {type}
            </button>
          ))}
        </div>

        <button
          disabled
          className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#003087] text-sm font-semibold text-white opacity-50"
        >
          Request Ride — Sprint 5
        </button>
      </div>
    </div>
  );
}
