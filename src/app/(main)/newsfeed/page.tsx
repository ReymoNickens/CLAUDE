import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Newsfeed' };

export default function NewsfeedPage() {
  return (
    <div className="p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003087]">Campus Newsfeed</h1>
          <p className="text-sm text-muted-foreground">Latest from the UCC community</p>
        </div>
      </header>

      {/* Placeholder content — Sprint 2 */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 h-4 w-20 rounded bg-muted" />
            <div className="mb-1 h-5 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Full newsfeed — Sprint 2
      </p>
    </div>
  );
}
