'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BookingWithReturns, Return } from '@/lib/types';

export default function MappingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingWithReturns | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form state for new return
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

    // Reset form and reload
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

  const markEmailsReceived = async () => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails_received_at: new Date().toISOString() }),
    });
    loadBooking();
  };

  if (loading || !booking) {
    return <main className="p-4"><p>Loading...</p></main>;
  }

  return (
    <main className="p-4 pb-32">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-4">
        ← Back
      </button>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <h1 className="font-bold text-lg">{booking.customer_name}</h1>
        <p className="text-gray-600 text-sm">{booking.address}</p>
        <p className="text-gray-500 text-sm">{booking.phone}</p>
        {booking.access_notes && (
          <p className="text-gray-500 text-sm mt-1">Notes: {booking.access_notes}</p>
        )}
        <p className="text-sm mt-2">
          {new Date(booking.pickup_date).toLocaleDateString()} • {booking.pickup_slot}
        </p>
      </div>

      {!booking.emails_received_at && !booking.pasted_emails?.length && (
        <button
          onClick={markEmailsReceived}
          className="w-full py-2 mb-4 bg-yellow-100 text-yellow-800 rounded-lg text-sm"
        >
          Mark emails as received
        </button>
      )}

      {booking.pasted_emails && booking.pasted_emails.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Customer Emails ({booking.pasted_emails.length})</h2>
          <div className="space-y-2">
            {booking.pasted_emails.map((email, i) => (
              <details key={email.id} className="bg-yellow-50 border border-yellow-200 rounded-lg">
                <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-yellow-800">
                  Email {i + 1} — {new Date(email.pasted_at).toLocaleString()}
                </summary>
                <pre className="px-3 py-2 text-xs whitespace-pre-wrap border-t border-yellow-200 bg-white rounded-b-lg max-h-64 overflow-y-auto">
                  {email.content}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold mb-2">Returns ({booking.returns.length})</h2>

      <div className="space-y-3 mb-6">
        {booking.returns.map((ret) => (
          <div key={ret.id} className="bg-white rounded-lg border p-3">
            <div className="flex justify-between items-start mb-2">
              <input
                type="text"
                value={ret.bag_number || ''}
                onChange={(e) => updateReturn(ret.id, { bag_number: e.target.value })}
                placeholder="Bag #"
                className="w-20 px-2 py-1 border rounded text-sm font-mono"
              />
              <button
                onClick={() => deleteReturn(ret.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={ret.items.join(', ')}
                onChange={(e) => updateReturn(ret.id, {
                  items: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Items (comma separated)"
                className="w-full px-2 py-1 border rounded text-sm"
              />
              <input
                type="text"
                value={ret.destination || ''}
                onChange={(e) => updateReturn(ret.id, { destination: e.target.value })}
                placeholder="Destination (e.g., UPS Store - 4th & Main)"
                className="w-full px-2 py-1 border rounded text-sm"
              />
              <input
                type="date"
                value={ret.deadline || ''}
                onChange={(e) => updateReturn(ret.id, { deadline: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            {ret.deadline && (
              <p className={`text-xs mt-2 ${
                new Date(ret.deadline) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                  ? 'text-red-600 font-medium'
                  : 'text-gray-500'
              }`}>
                Due: {new Date(ret.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <h3 className="font-medium mb-2">Add Return</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={bagNumber}
            onChange={(e) => setBagNumber(e.target.value)}
            placeholder="Bag #"
            className="px-2 py-2 border rounded text-sm"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="px-2 py-2 border rounded text-sm"
          />
        </div>
        <input
          type="text"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          placeholder="Items (comma separated)"
          className="w-full px-2 py-2 border rounded text-sm mb-2"
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          className="w-full px-2 py-2 border rounded text-sm mb-2"
        />
        <button
          onClick={addReturn}
          disabled={adding || !items.trim()}
          className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add Return'}
        </button>
      </div>
    </main>
  );
}
