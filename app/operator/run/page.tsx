'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BookingWithReturns } from '@/lib/types';

interface GroupedStop {
  address: string;
  bookings: BookingWithReturns[];
  bagCount: number;
}

interface DropoffGroup {
  destination: string;
  bags: { bagNumber: string; bookingId: string; customerName: string }[];
}

export default function RunSheetPage() {
  const [bookings, setBookings] = useState<BookingWithReturns[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'pickup' | 'dropoff'>('pickup');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookings?date=${date}`)
      .then(res => res.json())
      .then(data => {
        // Filter to only bookings with mapped returns
        const ready = data.filter((b: BookingWithReturns) =>
          b.returns.length > 0 && b.returns.some(r => r.bag_number)
        );
        setBookings(ready);
        setLoading(false);
      });
  }, [date]);

  // Group by address for pickup view
  const pickupStops: GroupedStop[] = [];
  const addressMap = new Map<string, GroupedStop>();

  bookings.forEach(b => {
    const addr = b.address.toLowerCase().trim();
    if (!addressMap.has(addr)) {
      addressMap.set(addr, { address: b.address, bookings: [], bagCount: 0 });
    }
    const stop = addressMap.get(addr)!;
    stop.bookings.push(b);
    stop.bagCount += b.returns.filter(r => r.bag_number && r.status !== 'dropped').length;
  });

  addressMap.forEach(stop => pickupStops.push(stop));

  // Group by destination for dropoff view
  const dropoffGroups: DropoffGroup[] = [];
  const destMap = new Map<string, DropoffGroup>();

  bookings.forEach(b => {
    b.returns.forEach(r => {
      if (!r.destination || !r.bag_number || r.status === 'dropped') return;
      const dest = r.destination.toLowerCase().trim();
      if (!destMap.has(dest)) {
        destMap.set(dest, { destination: r.destination, bags: [] });
      }
      destMap.get(dest)!.bags.push({
        bagNumber: r.bag_number,
        bookingId: b.id,
        customerName: b.customer_name,
      });
    });
  });

  destMap.forEach(group => dropoffGroups.push(group));

  // Deadline warnings
  const urgentReturns = bookings.flatMap(b => b.returns).filter(r => {
    if (!r.deadline || r.status === 'dropped') return false;
    const deadline = new Date(r.deadline);
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    return deadline < fiveDays;
  });

  if (loading) {
    return <main className="p-4"><p>Loading...</p></main>;
  }

  return (
    <main className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
      </div>

      {urgentReturns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 font-medium text-sm">
            ⚠ {urgentReturns.length} return(s) expiring within 5 days
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('pickup')}
          className={`flex-1 py-2 rounded-lg text-sm ${
            view === 'pickup' ? 'bg-blue-600 text-white' : 'bg-white border'
          }`}
        >
          Pickup ({pickupStops.length} stops)
        </button>
        <button
          onClick={() => setView('dropoff')}
          className={`flex-1 py-2 rounded-lg text-sm ${
            view === 'dropoff' ? 'bg-blue-600 text-white' : 'bg-white border'
          }`}
        >
          Drop-off ({dropoffGroups.length} stops)
        </button>
      </div>

      {view === 'pickup' ? (
        <div className="space-y-3">
          {pickupStops.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pickups for this date</p>
          ) : (
            pickupStops.map((stop, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <p className="font-medium">{stop.address}</p>
                <p className="text-sm text-gray-600">
                  {stop.bagCount} bag(s) • {stop.bookings.length} customer(s)
                </p>
                <div className="mt-2 space-y-1">
                  {stop.bookings.map(b => (
                    <Link
                      key={b.id}
                      href={`/operator/pickup/${b.id}`}
                      className="block text-sm text-blue-600"
                    >
                      {b.customer_name}: bags {b.returns.filter(r => r.bag_number).map(r => r.bag_number).join(', ')}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dropoffGroups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No drop-offs pending</p>
          ) : (
            dropoffGroups.map((group, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <p className="font-medium">{group.destination}</p>
                <p className="text-sm text-gray-600">{group.bags.length} bag(s)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.bags.map((bag, j) => (
                    <span key={j} className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      #{bag.bagNumber}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
