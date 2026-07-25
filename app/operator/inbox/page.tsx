'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BookingWithReturns } from '@/lib/types';
import { getBookingStatus } from '@/lib/types';

export default function InboxPage() {
  const [bookings, setBookings] = useState<BookingWithReturns[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'needs_mapping'>('all');

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  }, []);

  const filtered = bookings.filter(b => {
    const status = getBookingStatus(b);
    if (filter === 'awaiting') return status === 'awaiting_emails';
    if (filter === 'needs_mapping') return status === 'needs_mapping';
    return true;
  });

  const statusBadge = (booking: BookingWithReturns) => {
    const status = getBookingStatus(booking);
    const styles: Record<string, string> = {
      awaiting_emails: 'bg-yellow-100 text-yellow-800',
      needs_mapping: 'bg-blue-100 text-blue-800',
      ready_for_pickup: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      complete: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      awaiting_emails: 'No emails',
      needs_mapping: 'Needs mapping',
      ready_for_pickup: 'Ready',
      in_progress: 'In progress',
      complete: 'Done',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <main className="p-4"><p>Loading...</p></main>;
  }

  return (
    <main className="p-4">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'awaiting', 'needs_mapping'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            {f === 'all' ? 'All' : f === 'awaiting' ? 'Awaiting Emails' : 'Needs Mapping'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No bookings</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(booking => (
            <Link
              key={booking.id}
              href={`/operator/booking/${booking.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-blue-300"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">{booking.customer_name}</span>
                {statusBadge(booking)}
              </div>
              <p className="text-sm text-gray-600 truncate">{booking.address}</p>
              <p className="text-sm text-gray-500">
                {new Date(booking.pickup_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' • '}{booking.pickup_slot}
                {booking.returns.length > 0 && ` • ${booking.returns.length} return(s)`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
