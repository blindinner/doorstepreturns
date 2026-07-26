'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BookingWithReturns, Return } from '@/lib/types';
import { parseAmazonReturnEmail, type ParsedReturn } from '@/lib/parse-email';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
};

export default function MappingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingWithReturns | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [items, setItems] = useState('');
  const [destination, setDestination] = useState('');
  const [bagNumber, setBagNumber] = useState('');
  const [deadline, setDeadline] = useState('');

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

  const addReturn = async () => {
    if (!items.trim()) return;
    setAdding(true);
    await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: id,
        items: items.split(',').map(s => s.trim()).filter(Boolean),
        destination: destination || null,
        bag_number: bagNumber || null,
        deadline: deadline || null,
      }),
    });
    setItems('');
    setDestination('');
    setBagNumber('');
    setDeadline('');
    setAdding(false);
    loadBooking();
  };

  const updateReturn = async (returnId: string, updates: Partial<Return>) => {
    await fetch(`/api/returns/${returnId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    loadBooking();
  };

  const deleteReturn = async (returnId: string) => {
    if (!confirm('Delete this return?')) return;
    await fetch(`/api/returns/${returnId}`, { method: 'DELETE' });
    loadBooking();
  };

  if (loading || !booking) {
    return <p style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</p>;
  }

  return (
    <div style={{ paddingBottom: 280 }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: '#0f5c48',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Back to inbox
      </button>

      {/* Customer Info Card */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>{booking.customer_name}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 15, color: '#374151' }}>{booking.address}</p>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{booking.phone}</p>
          {booking.access_notes && (
            <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
              {booking.access_notes}
            </p>
          )}
        </div>
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #f3f4f6',
          fontSize: 14,
          color: '#6b7280',
        }}>
          {new Date(booking.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}{booking.pickup_slot}
        </div>
      </div>

      {/* Forwarded Emails */}
      {booking.pasted_emails && booking.pasted_emails.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16, background: '#fffbeb' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#92400e' }}>
            Forwarded Emails ({booking.pasted_emails.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {booking.pasted_emails.map((email, i) => {
              const parsed = parseAmazonReturnEmail(email.content);
              const hasParsedData = parsed.orderId || parsed.carrier || parsed.deadline;

              return (
                <div key={email.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #fcd34d' }}>
                  {/* Parsed Data Summary */}
                  {hasParsedData && (
                    <div style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #fcd34d',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                    }}>
                      {parsed.orderId && (
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: 'monospace',
                        }}>
                          #{parsed.orderId}
                        </span>
                      )}
                      {parsed.destination && (
                        <span style={{
                          background: '#d1fae5',
                          color: '#065f46',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                        }}>
                          {parsed.destination}
                        </span>
                      )}
                      {parsed.deadline && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                        }}>
                          Due: {new Date(parsed.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <button
                        onClick={async () => {
                          await fetch('/api/returns', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              booking_id: id,
                              items: parsed.orderId ? [`Order ${parsed.orderId}`] : ['Amazon Return'],
                              destination: parsed.destination || null,
                              deadline: parsed.deadline || null,
                            }),
                          });
                          loadBooking();
                        }}
                        style={{
                          marginLeft: 'auto',
                          background: '#0f5c48',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        + Add Return
                      </button>
                    </div>
                  )}

                  <details>
                    <summary style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#92400e',
                    }}>
                      {hasParsedData ? 'View full email' : `Email ${i + 1} — ${new Date(email.pasted_at).toLocaleString()}`}
                    </summary>
                    <pre style={{
                      margin: 0,
                      padding: 14,
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      borderTop: '1px solid #fcd34d',
                      background: '#fefce8',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}>
                      {email.content}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Returns */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Returns ({booking.returns.length})
        </h2>

        {booking.returns.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No returns added yet. Use the form below to add returns.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {booking.returns.map((ret) => (
              <div key={ret.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <input
                    type="text"
                    value={ret.bag_number || ''}
                    onChange={(e) => updateReturn(ret.id, { bag_number: e.target.value })}
                    placeholder="Bag #"
                    style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontWeight: 600 }}
                  />
                  <button
                    onClick={() => deleteReturn(ret.id)}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text"
                    value={ret.items.join(', ')}
                    onChange={(e) => updateReturn(ret.id, {
                      items: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Items (comma separated)"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={ret.destination || ''}
                    onChange={(e) => updateReturn(ret.id, { destination: e.target.value })}
                    placeholder="Destination (e.g., UPS Store)"
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={ret.deadline || ''}
                    onChange={(e) => updateReturn(ret.id, { deadline: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                {ret.deadline && (
                  <p style={{
                    margin: '12px 0 0',
                    fontSize: 13,
                    color: new Date(ret.deadline) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? '#dc2626' : '#6b7280',
                    fontWeight: new Date(ret.deadline) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 600 : 400,
                  }}>
                    Due: {new Date(ret.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Return Form */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: 20,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Add Return</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input
              type="text"
              value={bagNumber}
              onChange={(e) => setBagNumber(e.target.value)}
              placeholder="Bag #"
              style={inputStyle}
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
            />
          </div>
          <input
            type="text"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder="Items (comma separated)"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <button
            onClick={addReturn}
            disabled={adding || !items.trim()}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: adding || !items.trim() ? '#d1d5db' : '#0f5c48',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: adding || !items.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {adding ? 'Adding...' : 'Add Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
