import type { Accommodation } from '@/types';

const AMENITY_LABELS: { key: keyof Pick<Accommodation,'has_water'|'has_electricity'|'has_wifi'|'has_security'|'is_self_contained'>; label: string; icon: string }[] = [
  { key: 'has_water',        label: 'Water',          icon: '💧' },
  { key: 'has_electricity',  label: 'Electricity',    icon: '⚡' },
  { key: 'has_wifi',         label: 'WiFi',           icon: '📶' },
  { key: 'has_security',     label: 'Security',       icon: '🔒' },
  { key: 'is_self_contained',label: 'Self-contained', icon: '🏠' },
];

interface AmenitiesChipsProps {
  accommodation: Accommodation;
  variant?: 'compact' | 'full';
}

export function AmenitiesChips({ accommodation, variant = 'full' }: AmenitiesChipsProps) {
  const active = AMENITY_LABELS.filter((a) => accommodation[a.key]);
  if (active.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        {active.slice(0, 3).map((a) => (
          <span key={a.key} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {a.icon} {a.label}
          </span>
        ))}
        {active.length > 3 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            +{active.length - 3}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITY_LABELS.map((a) => (
        <span
          key={a.key}
          className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
            accommodation[a.key]
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-border bg-muted/50 text-muted-foreground line-through opacity-50'
          }`}
        >
          {a.icon} {a.label}
        </span>
      ))}
    </div>
  );
}
