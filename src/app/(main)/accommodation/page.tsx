import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Accommodation' };

export default function AccommodationPage() {
  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#003087]">Accommodation</h1>
        <p className="text-sm text-muted-foreground">Find housing near UCC</p>
      </header>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 h-32 w-full rounded-lg bg-muted" />
            <div className="mb-1 h-5 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Listings with filtering — Sprint 3
      </p>
    </div>
  );
}
