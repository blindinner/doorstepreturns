'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const CONFIG = {
  serviceName: "Doorstep Returns",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div className="rt-eyebrow" style={{ color: 'var(--ink70)', marginBottom: 6 }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 12.5, color: 'var(--ink40)', marginTop: 5 }}>{hint}</div>
      )}
    </label>
  );
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL param (from auto-reply link)
  const prefillEmail = searchParams.get('email') || '';

  const [f, setF] = useState({
    name: "",
    email: prefillEmail,
    phone: "",
    address: "",
    access: "",
    date: "",
    time: "evening",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Get tomorrow as minimum date
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const ready = f.name && f.email && f.phone && f.address && f.date;

  async function submit() {
    setBusy(true);
    setErr("");

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: f.name,
          customer_email: f.email,
          phone: f.phone,
          address: f.address,
          access_notes: f.access,
          pickup_date: f.date,
          pickup_slot: f.time,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Booking failed');
      }

      const { token } = await res.json();
      router.push(`/confirm/${token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "42px 0 60px", maxWidth: 520 }}>
      <h2
        className="rt-serif"
        style={{ fontSize: 30, fontWeight: 400, margin: "0 0 8px" }}
      >
        Book your pickup
      </h2>
      <p className="rt-serif" style={{ color: 'var(--ink70)', fontSize: 16, margin: "0 0 28px" }}>
        Tell us where and when to pick up your return.
      </p>

      <Field label="Name">
        <input
          className="rt-in"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="Jordan Reyes"
        />
      </Field>
      <Field label="Email" hint="This should match the email you forwarded from.">
        <input
          type="email"
          className="rt-in"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          placeholder="jordan@example.com"
        />
      </Field>
      <Field label="Mobile" hint="We'll text you pickup updates.">
        <input
          className="rt-in"
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
          placeholder="(555) 018-2244"
        />
      </Field>
      <Field label="Pickup address" hint="Include your apartment or unit number.">
        <input
          className="rt-in"
          value={f.address}
          onChange={(e) => setF({ ...f, address: e.target.value })}
          placeholder="118 Bergen St, Apt 4R"
        />
      </Field>
      <Field label="Pickup date">
        <input
          type="date"
          className="rt-in"
          value={f.date}
          min={minDate}
          onChange={(e) => setF({ ...f, date: e.target.value })}
        />
      </Field>
      <Field label="Pickup time">
        <select
          className="rt-in"
          value={f.time}
          onChange={(e) => setF({ ...f, time: e.target.value })}
        >
          <option value="morning">Morning (9am – 12pm)</option>
          <option value="afternoon">Afternoon (12pm – 5pm)</option>
          <option value="evening">Evening (5pm – 8pm)</option>
        </select>
      </Field>
      <Field
        label="Access notes"
        hint="Doorman, gate code, which buzzer, where to find you."
      >
        <textarea
          className="rt-in"
          rows={3}
          value={f.access}
          onChange={(e) => setF({ ...f, access: e.target.value })}
          placeholder="Buzzer 4R. Doorman has a package shelf behind the desk."
          style={{ resize: "vertical" }}
        />
      </Field>

      {err && (
        <div
          style={{
            color: 'var(--warn)',
            fontSize: 14,
            marginBottom: 14,
            padding: "11px 13px",
            background: "#fdf2ea",
            borderRadius: 3,
            lineHeight: 1.5,
          }}
        >
          {err}
        </div>
      )}

      <button className="rt-btn" onClick={submit} disabled={!ready || busy}>
        {busy ? "Booking…" : "Book Pickup"}
      </button>
      {!ready && (
        <div style={{ fontSize: 12.5, color: 'var(--ink40)', marginTop: 10 }}>
          Fill in all fields to continue.
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
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

        <Suspense fallback={<div style={{ padding: "42px 0" }}>Loading...</div>}>
          <BookingForm />
        </Suspense>

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
          We&apos;re a courier, not an inspector — we can&apos;t verify what&apos;s inside
          sealed packaging, so we photograph everything with you at the door.
        </footer>
      </div>
    </div>
  );
}
