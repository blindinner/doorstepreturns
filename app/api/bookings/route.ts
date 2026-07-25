import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { customer_name, customer_email, phone, address, access_notes, pickup_date, pickup_slot } = body;

  if (!customer_name || !phone || !address || !pickup_date || !pickup_slot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const booking = await db.createBooking({
    token: nanoid(12),
    customer_name,
    customer_email: customer_email || undefined,
    phone,
    address,
    access_notes: access_notes || null,
    pickup_date,
    pickup_slot,
    emails_received_at: null,
    payment_status: 'pending',
    payment_ref: null,
    order_status: 'open',
  });

  return NextResponse.json({ token: booking.token, id: booking.id });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let bookings = await db.getAllBookingsWithReturns();

  if (date) {
    bookings = bookings.filter(b => b.pickup_date === date);
  }

  return NextResponse.json(bookings);
}
