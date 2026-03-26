import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Services' };

const CATEGORY_ICONS: Record<string, string> = {
  'Chop Bars': '🍲',
  Printing: '🖨️',
  Salons: '✂️',
  Tailors: '🧵',
  'Phone Repair': '📱',
  Pharmacies: '💊',
  Tutors: '📚',
  Laundry: '👕',
};

export default function ServicesPage() {
  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#003087]">Local Services</h1>
        <p className="text-sm text-muted-foreground">Businesses near UCC campus</p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
          <div
            key={name}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center shadow-sm"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium leading-tight">{name}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Full directory with search & reviews — Sprint 4
      </p>
    </div>
  );
}
