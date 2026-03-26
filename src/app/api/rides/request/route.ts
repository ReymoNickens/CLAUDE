import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance, calculateFare } from '@/lib/utils/fare';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    vehicleType: 'Car' | 'Pragya';
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    destLat: number;
    destLng: number;
    destAddress?: string;
  };

  const { vehicleType, pickupLat, pickupLng, pickupAddress, destLat, destLng, destAddress } = body;

  // Get fare rate
  const { data: rateRow } = await supabase
    .from('fare_rates')
    .select('price_per_km, base_fare')
    .eq('vehicle_type', vehicleType)
    .single();

  const pricePerKm = rateRow?.price_per_km ?? (vehicleType === 'Car' ? 2.5 : 1.5);
  const baseFare = rateRow?.base_fare ?? (vehicleType === 'Car' ? 5 : 3);

  const distanceKm = haversineDistance(
    { lat: pickupLat, lng: pickupLng },
    { lat: destLat, lng: destLng }
  );
  const fareAmount = calculateFare(distanceKm, pricePerKm, baseFare);
  const commissionAmount = parseFloat((fareAmount * 0.1).toFixed(2));
  const driverEarnings = parseFloat((fareAmount - commissionAmount).toFixed(2));

  // Find nearest online, approved driver with matching vehicle type
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, current_lat, current_lng')
    .eq('vehicle_type', vehicleType)
    .eq('is_online', true)
    .eq('status', 'approved')
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null);

  let nearestDriverId: string | null = null;
  let minDist = Infinity;

  for (const driver of drivers ?? []) {
    if (driver.current_lat == null || driver.current_lng == null) continue;
    const d = haversineDistance(
      { lat: pickupLat, lng: pickupLng },
      { lat: driver.current_lat, lng: driver.current_lng }
    );
    if (d < minDist) {
      minDist = d;
      nearestDriverId = driver.id;
    }
  }

  // Create ride
  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      student_id: user.id,
      driver_id: nearestDriverId,
      vehicle_type: vehicleType,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      pickup_address: pickupAddress ?? null,
      dest_lat: destLat,
      dest_lng: destLng,
      dest_address: destAddress ?? null,
      distance_km: distanceKm,
      fare_amount: fareAmount,
      commission_amount: commissionAmount,
      driver_earnings: driverEarnings,
      payment_method: 'cash',
      status: nearestDriverId ? 'pending' : 'cancelled',
      cancel_reason: nearestDriverId ? null : 'No drivers available',
    })
    .select('id, status, fare_amount, distance_km, driver_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!nearestDriverId) {
    return NextResponse.json({ error: 'No drivers available right now. Try again shortly.' }, { status: 503 });
  }

  return NextResponse.json({ rideId: ride.id, fareAmount: ride.fare_amount, distanceKm: ride.distance_km });
}
