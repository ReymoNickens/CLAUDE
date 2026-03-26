import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rideId, reason } = await req.json() as { rideId: string; reason?: string };

  const { data: ride } = await supabase
    .from('rides')
    .select('id, student_id, driver_id, status, requested_at')
    .eq('id', rideId)
    .single();

  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });

  const isStudent = ride.student_id === user.id;
  const isDriver = ride.driver_id === user.id;

  if (!isStudent && !isDriver) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Students can only cancel within 2 minutes
  if (isStudent) {
    const elapsed = Date.now() - new Date(ride.requested_at).getTime();
    if (elapsed > 2 * 60 * 1000 && ride.status !== 'pending') {
      return NextResponse.json({ error: 'Cancellation window has expired (2 minutes)' }, { status: 400 });
    }
  }

  const cancellableStatuses = ['pending', 'accepted'];
  if (!cancellableStatuses.includes(ride.status)) {
    return NextResponse.json({ error: 'Ride cannot be cancelled at this stage' }, { status: 400 });
  }

  const { error } = await supabase
    .from('rides')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? (isStudent ? 'Cancelled by student' : 'Cancelled by driver'),
    })
    .eq('id', rideId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
