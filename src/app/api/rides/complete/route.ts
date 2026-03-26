import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rideId } = await req.json() as { rideId: string };

  // Verify this driver owns the ride
  const { data: ride } = await supabase
    .from('rides')
    .select('id, driver_id, status, commission_amount, fare_amount, driver_earnings')
    .eq('id', rideId)
    .single();

  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });

  // Check caller is the driver on this ride (profile.id = driver.id for drivers)
  if (ride.driver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (ride.status !== 'in_progress') {
    return NextResponse.json({ error: 'Ride is not in progress' }, { status: 400 });
  }

  // Mark ride complete
  const { error: updateErr } = await supabase
    .from('rides')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', rideId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // The DB trigger handle_ride_completion will update driver earnings + commission_owed

  return NextResponse.json({ success: true });
}
