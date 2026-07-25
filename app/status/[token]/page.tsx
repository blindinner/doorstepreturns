'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { BookingWithReturns } from '@/lib/types';
import { getBookingStatus } from '@/lib/types';

export default function StatusPage() {
  const params = useParams();
  const token = params.token as string;
  const [booking, setBooking] = useState<BookingWithReturns | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${token}`)
      .then(res => res.json())
      .then(data => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
        <Link href="/" className="text-blue-600 underline">Book a new pickup</Link>
      </main>
    );
  }

  const status = getBookingStatus(booking);
  const slotLabels: Record<string, string> = {
    morning: '9am - 12pm',
    afternoon: '12pm - 5pm',
    evening: '5pm - 8pm',
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    awaiting_emails: { text: 'Awaiting your return emails', color: 'text-yellow-600' },
    needs_mapping: { text: 'Processing your returns', color: 'text-blue-600' },
    ready_for_pickup: { text: 'Ready for pickup', color: 'text-green-600' },
    in_progress: { text: 'Pickup in progress', color: 'text-blue-600' },
    complete: { text: 'All returns dropped off!', color: 'text-green-600' },
    has_failures: { text: 'Issue with some returns', color: 'text-red-600' },
  };

  const returnStatusLabels: Record<string, string> = {
    pending: 'Pending',
    bagged: 'Picked up',
    dropped: 'Dropped off',
    failed: 'Issue',
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Pickup Status</h1>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <p className="text-gray-600">{booking.customer_name}</p>
        <p className="text-gray-600">
          {new Date(booking.pickup_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' '}{slotLabels[booking.pickup_slot]}
        </p>
        <p className={`font-semibold mt-2 ${statusLabels[status]?.color || 'text-gray-600'}`}>
          {statusLabels[status]?.text || status}
        </p>
      </div>

      {!booking.emails_received_at && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            Forward your Amazon return emails to <strong>returns@doorstepreturns.com</strong>
          </p>
        </div>
      )}

      {booking.returns.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Your Returns</h2>
          {booking.returns.map((ret) => (
            <div key={ret.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {ret.bag_number && (
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      Bag #{ret.bag_number}
                    </span>
                  )}
                </div>
                <span className={`text-sm ${ret.status === 'dropped' ? 'text-green-600' : 'text-gray-500'}`}>
                  {returnStatusLabels[ret.status]}
                </span>
              </div>

              {ret.items.length > 0 && (
                <p className="text-gray-600 text-sm mb-1">
                  {ret.items.join(', ')}
                </p>
              )}

              {ret.destination && (
                <p className="text-gray-500 text-sm">
                  Drop-off: {ret.destination}
                </p>
              )}

              {ret.tracking_number && (
                <p className="text-green-700 text-sm mt-2 font-mono">
                  Tracking: {ret.tracking_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
