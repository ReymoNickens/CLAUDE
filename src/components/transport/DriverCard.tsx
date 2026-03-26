import { Phone, Star } from 'lucide-react';
import type { VehicleType } from '@/types';

interface DriverCardProps {
  driverName: string;
  vehicleType: VehicleType;
  plateNumber: string | null;
  rating: number;
  phone: string | null;
  eta?: number | null; // minutes
}

export function DriverCard({ driverName, vehicleType, plateNumber, rating, phone, eta }: DriverCardProps) {
  const initials = driverName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#003087] text-white font-bold text-sm">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{driverName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 fill-[#FFD700] stroke-[#FFD700]" />
            <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground mx-1">·</span>
            <span className="text-xs text-muted-foreground">{vehicleType === 'Car' ? '🚗' : '🛺'} {vehicleType}</span>
            {plateNumber && (
              <>
                <span className="text-xs text-muted-foreground mx-1">·</span>
                <span className="text-xs font-mono font-medium">{plateNumber}</span>
              </>
            )}
          </div>
          {eta !== null && eta !== undefined && (
            <p className="text-xs text-[#003087] font-medium mt-0.5">ETA: ~{eta} min</p>
          )}
        </div>

        {/* Call button */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003087] text-white shadow-sm"
            aria-label="Call driver"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
