import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { booking_id, items, destination, bag_number, deadline, qr_image_url } = body;

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
  }

  const ret = await db.createReturn({
    booking_id,
    items: items || [],
    destination: destination || null,
    bag_number: bag_number || null,
    deadline: deadline || null,
    qr_image_url: qr_image_url || null,
    status: 'pending',
    tracking_number: null,
    pickup_photo_urls: [],
    receipt_photo_url: null,
  });

  // Mark booking as having received emails if this is the first return
  const booking = await db.getBooking(booking_id);
  if (booking && !booking.emails_received_at) {
    await db.updateBooking(booking_id, { emails_received_at: new Date().toISOString() });
  }

  return NextResponse.json(ret);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bagNumber = searchParams.get('bag_number');

  if (bagNumber) {
    const ret = await db.getReturnByBagNumber(bagNumber);

    if (!ret) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json(ret);
  }

  // Get all returns
  const returns = await db.getReturns();
  return NextResponse.json(returns);
}
