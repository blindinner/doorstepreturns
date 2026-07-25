'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { BookingWithReturns } from '@/lib/types';

const CONFIG = {
  serviceName: "Doorstep Returns",
};

export default function ConfirmPage() {
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', padding: 22 }}>
        <h1 className="rt-serif" style={{ fontSize: 30 }}>Booking not found</h1>
        <Link href="/" style={{ color: 'var(--accent)' }}>Go back home</Link>
      </div>
    );
  }

  const pickupDate = new Date(booking.pickup_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeSlots: Record<string, string> = {
    morning: '9am – 12pm',
    afternoon: '12pm – 5pm',
    evening: '5pm – 8pm',
  };
  const pickupTime = timeSlots[booking.pickup_slot] || '5pm – 8pm';

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 22px" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "22px 0",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <div
              className="rt-mono"
              style={{
                background: 'var(--tag)',
                color: 'var(--tag-ink)',
                fontWeight: 700,
                fontSize: 12,
                padding: "4px 7px",
                borderRadius: 2,
              }}
            >
              ↩
            </div>
            <div style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
              {CONFIG.serviceName}
            </div>
          </Link>
        </header>

        {/* Confirmation Content */}
        <div style={{ padding: "60px 0", maxWidth: 560 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <div className="rt-eyebrow" style={{ color: 'var(--accent)', marginBottom: 14 }}>
            Pickup Confirmed
          </div>
          <h2
            className="rt-serif"
            style={{ fontSize: 32, fontWeight: 400, margin: "0 0 14px", lineHeight: 1.15 }}
          >
            {pickupDate}
          </h2>
          <p style={{ fontSize: 18, color: 'var(--ink70)', margin: '0 0 32px' }}>
            {pickupTime}
          </p>

          <div
            style={{
              background: 'var(--surface)',
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--ink40)', marginBottom: 4 }}>Pickup address</div>
              <div style={{ fontSize: 15 }}>{booking.address}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--ink40)', marginBottom: 4 }}>Contact</div>
              <div style={{ fontSize: 15 }}>{booking.customer_name} · {booking.phone}</div>
            </div>
            {booking.access_notes && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink40)', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 15 }}>{booking.access_notes}</div>
              </div>
            )}
          </div>

          <p className="rt-serif" style={{ fontSize: 15, color: 'var(--ink70)', lineHeight: 1.6 }}>
            We&apos;ll text you when we&apos;re on the way. Have your return items ready at the door.
          </p>

          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid var(--line)",
              fontSize: 14,
              color: 'var(--ink40)',
            }}
          >
            Reference{" "}
            <span className="rt-mono" style={{ color: 'var(--ink70)' }}>
              {token.toUpperCase()}
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            <Link href={`/status/${token}`}>
              <button className="rt-btn rt-btn-ghost rt-btn-sm">
                Track your pickup
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--line)",
            padding: "22px 0 30px",
            fontSize: 12.5,
            color: 'var(--ink40)',
            lineHeight: 1.6,
          }}
        >
          Questions? Reply to your confirmation email or text us.
        </footer>
      </div>
    </div>
  );
}
