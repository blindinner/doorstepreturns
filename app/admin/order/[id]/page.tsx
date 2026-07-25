'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingWithReturns | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBooking = () => {
    fetch(`/api/bookings/${id}`)
      .then(res => res.json())
      .then(data => {
        setBooking(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: status }),
    });
    loadBooking();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!booking) {
    return (
      <div>
        <p>Order not found</p>
        <Link href="/admin">← Back to orders</Link>
      </div>
    );
  }

  const status = booking.order_status || 'open';
  const config = STATUS_CONFIG[status];

  return (
    <div>
      <Link
        href="/admin"
        style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}
      >
        ← Back to orders
      </Link>

      <div style={{ marginTop: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 className="rt-serif" style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>
            {booking.customer_name}
          </h1>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 600,
              background: config.bg,
              color: config.color,
            }}
          >
            {config.label}
          </span>
        </div>
        <p style={{ color: 'var(--ink40)', fontSize: 13, margin: 0 }}>
          Order #{booking.token.toUpperCase()} · Created {new Date(booking.created_at).toLocaleDateString()}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Order Info */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: 20,
        }}>
          <h2 className="rt-eyebrow" style={{ color: 'var(--ink40)', marginBottom: 16 }}>
            Pickup Details
          </h2>

          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--ink40)' }}>Address</p>
            <p style={{ margin: 0, fontSize: 15 }}>{booking.address}</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--ink40)' }}>Phone</p>
            <p style={{ margin: 0, fontSize: 15 }}>{booking.phone}</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--ink40)' }}>Pickup Date</p>
            <p style={{ margin: 0, fontSize: 15 }}>
              {new Date(booking.pickup_date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              {' · '}{TIME_SLOTS[booking.pickup_slot]}
            </p>
          </div>

          {booking.access_notes && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--ink40)' }}>Access Notes</p>
              <p style={{ margin: 0, fontSize: 15 }}>{booking.access_notes}</p>
            </div>
          )}
        </div>

        {/* Status Update */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: 20,
        }}>
          <h2 className="rt-eyebrow" style={{ color: 'var(--ink40)', marginBottom: 16 }}>
            Update Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['open', 'picked_up', 'returned', 'cancelled'] as OrderStatus[]).map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 3,
                  border: status === s ? `2px solid ${STATUS_CONFIG[s].color}` : '1px solid var(--line)',
                  background: status === s ? STATUS_CONFIG[s].bg : 'transparent',
                  color: status === s ? STATUS_CONFIG[s].color : 'var(--ink)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {STATUS_CONFIG[s].label}
                {status === s && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Emails */}
      {booking.pasted_emails && booking.pasted_emails.length > 0 && (
        <div style={{
          marginTop: 20,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: 20,
        }}>
          <h2 className="rt-eyebrow" style={{ color: 'var(--ink40)', marginBottom: 16 }}>
            Customer Emails ({booking.pasted_emails.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {booking.pasted_emails.map((email, i) => (
              <div
                key={email.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  background: '#f9fafb',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  Email {i + 1} — {new Date(email.pasted_at).toLocaleString()}
                </div>
                <pre style={{
                  margin: 0,
                  padding: 14,
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 300,
                  overflow: 'auto',
                  background: '#fff',
                }}>
                  {email.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns / Items */}
      {booking.returns && booking.returns.length > 0 && (
        <div style={{
          marginTop: 20,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: 20,
        }}>
          <h2 className="rt-eyebrow" style={{ color: 'var(--ink40)', marginBottom: 16 }}>
            Return Items ({booking.returns.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {booking.returns.map((ret) => (
              <div
                key={ret.id}
                style={{
                  padding: 14,
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  {ret.bag_number && (
                    <span className="rt-mono" style={{
                      background: 'var(--tag)',
                      color: 'var(--tag-ink)',
                      padding: '3px 8px',
                      borderRadius: 3,
                      fontSize: 13,
                      fontWeight: 700,
                    }}>
                      Bag #{ret.bag_number}
                    </span>
                  )}
                  <span style={{
                    fontSize: 12,
                    color: ret.status === 'dropped' ? '#166534' : 'var(--ink40)',
                    fontWeight: 500,
                  }}>
                    {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                  </span>
                </div>
                {ret.items.length > 0 && (
                  <p style={{ margin: '0 0 4px', fontSize: 14 }}>{ret.items.join(', ')}</p>
                )}
                {ret.destination && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink40)' }}>→ {ret.destination}</p>
                )}
                {ret.tracking_number && (
                  <p className="rt-mono" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--accent)' }}>
                    Tracking: {ret.tracking_number}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
