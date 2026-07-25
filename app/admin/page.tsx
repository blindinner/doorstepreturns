'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BookingWithReturns, OrderStatus } from '@/lib/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#0f5c48', bg: '#e6f0ec' },
  picked_up: { label: 'Picked Up', color: '#1e40af', bg: '#dbeafe' },
  returned: { label: 'Returned', color: '#166534', bg: '#dcfce7' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
};

const TIME_SLOTS: Record<string, string> = {
  morning: '9am – 12pm',
  afternoon: '12pm – 5pm',
  evening: '5pm – 8pm',
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<BookingWithReturns[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const loadBookings = () => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        // Sort by created_at descending (newest first)
        const sorted = data.sort((a: BookingWithReturns, b: BookingWithReturns) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setBookings(sorted);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const updateStatus = async (bookingId: string, status: OrderStatus) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: status }),
    });
    loadBookings();
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.order_status === filter);

  const counts = {
    all: bookings.length,
    open: bookings.filter(b => b.order_status === 'open').length,
    picked_up: bookings.filter(b => b.order_status === 'picked_up').length,
    returned: bookings.filter(b => b.order_status === 'returned').length,
    cancelled: bookings.filter(b => b.order_status === 'cancelled').length,
  };

  if (loading) {
    return <p>Loading orders...</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="rt-serif" style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Orders</h1>
        <p style={{ color: 'var(--ink70)', fontSize: 14, margin: '4px 0 0' }}>
          {bookings.length} total order{bookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'open', 'picked_up', 'returned', 'cancelled'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 14px',
              borderRadius: 3,
              border: '1px solid var(--line)',
              background: filter === status ? 'var(--accent)' : 'var(--surface)',
              color: filter === status ? '#fff' : 'var(--ink)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {status === 'all' ? 'All' : STATUS_CONFIG[status].label} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--line)',
        }}>
          <p style={{ color: 'var(--ink40)', margin: 0 }}>No orders found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(booking => {
            const status = booking.order_status || 'open';
            const config = STATUS_CONFIG[status];
            const emailCount = booking.pasted_emails?.length || 0;

            return (
              <div
                key={booking.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{booking.customer_name}</span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 600,
                          background: config.bg,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 4px', color: 'var(--ink70)', fontSize: 14 }}>
                      {booking.address}
                    </p>
                    <p style={{ margin: 0, color: 'var(--ink40)', fontSize: 13 }}>
                      {booking.phone}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 150 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
                      {new Date(booking.pickup_date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p style={{ margin: '2px 0 0', color: 'var(--ink70)', fontSize: 13 }}>
                      {TIME_SLOTS[booking.pickup_slot]}
                    </p>
                    {emailCount > 0 && (
                      <p style={{ margin: '6px 0 0', color: 'var(--accent)', fontSize: 12 }}>
                        {emailCount} email{emailCount > 1 ? 's' : ''} received
                      </p>
                    )}
                  </div>
                </div>

                {/* Status buttons */}
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--ink40)', marginRight: 8 }}>Update status:</span>
                  {(['open', 'picked_up', 'returned', 'cancelled'] as OrderStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(booking.id, s)}
                      disabled={status === s}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 3,
                        border: status === s ? 'none' : '1px solid var(--line)',
                        background: status === s ? STATUS_CONFIG[s].bg : 'transparent',
                        color: status === s ? STATUS_CONFIG[s].color : 'var(--ink70)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: status === s ? 'default' : 'pointer',
                        opacity: status === s ? 1 : 0.8,
                      }}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}

                  <Link
                    href={`/admin/order/${booking.id}`}
                    style={{
                      marginLeft: 'auto',
                      padding: '6px 12px',
                      borderRadius: 3,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
