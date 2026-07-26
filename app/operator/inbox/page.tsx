'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BookingWithReturns } from '@/lib/types';
import { getBookingStatus } from '@/lib/types';

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  awaiting_emails: { bg: '#fef3c7', color: '#92400e', label: 'Awaiting emails' },
  needs_mapping: { bg: '#dbeafe', color: '#1e40af', label: 'Needs mapping' },
  ready_for_pickup: { bg: '#d1fae5', color: '#065f46', label: 'Ready' },
  in_progress: { bg: '#ede9fe', color: '#5b21b6', label: 'In progress' },
  complete: { bg: '#f3f4f6', color: '#4b5563', label: 'Done' },
};

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

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'awaiting', label: 'Awaiting Emails' },
    { key: 'needs_mapping', label: 'Needs Mapping' },
  ] as const;

  if (loading) {
    return <p style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: filter === f.key ? '#0f5c48' : 'white',
              color: filter === f.key ? 'white' : '#4b5563',
              boxShadow: filter === f.key ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>No bookings</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(booking => {
            const status = getBookingStatus(booking);
            const config = statusConfig[status] || statusConfig.complete;

            return (
              <Link
                key={booking.id}
                href={`/operator/booking/${booking.id}`}
                style={{
                  display: 'block',
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 17 }}>{booking.customer_name}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: config.bg,
                    color: config.color,
                  }}>
                    {config.label}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 6px' }}>{booking.address}</p>
                <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                  {new Date(booking.pickup_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}{booking.pickup_slot}
                  {booking.returns.length > 0 && ` · ${booking.returns.length} return(s)`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
