'use client';

import { formatCurrency } from '@/lib/utils/currency';
import type { VehicleType } from '@/types';

interface FareEstimateProps {
  vehicleType: VehicleType;
  onVehicleChange: (type: VehicleType) => void;
  distanceKm: number | null;
  fare: number | null;
}

export function FareEstimate({ vehicleType, onVehicleChange, distanceKm, fare }: FareEstimateProps) {
  return (
    <div className="space-y-3">
      {/* Vehicle picker */}
      <div className="grid grid-cols-2 gap-2">
        {(['Car', 'Pragya'] as VehicleType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onVehicleChange(type)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
              vehicleType === type
                ? 'border-[#003087] bg-[#003087]/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <span className="text-2xl">{type === 'Car' ? '🚗' : '🛺'}</span>
            <span className={`text-sm font-semibold ${vehicleType === type ? 'text-[#003087]' : 'text-foreground'}`}>
              {type}
            </span>
            <span className="text-xs text-muted-foreground">
              {type === 'Car' ? 'GH₵2.50/km' : 'GH₵1.50/km'}
            </span>
          </button>
        ))}
      </div>

      {/* Fare display */}
      {distanceKm !== null && fare !== null && (
        <div className="rounded-xl bg-[#003087]/5 border border-[#003087]/20 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Estimated fare</p>
            <p className="text-lg font-bold text-[#003087]">{formatCurrency(fare)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-sm font-semibold">{distanceKm.toFixed(1)} km</p>
          </div>
        </div>
      )}
    </div>
  );
}
