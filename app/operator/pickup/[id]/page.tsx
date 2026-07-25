'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BookingWithReturns } from '@/lib/types';

export default function PickupModePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<BookingWithReturns | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBagIndex, setCurrentBagIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

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

  const bagsToPickup = booking?.returns.filter(r =>
    r.bag_number && r.status === 'pending'
  ) || [];

  const currentBag = bagsToPickup[currentBagIndex];

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBag) return;

    setUploading(true);

    // For MVP, we'll store as base64 data URL
    // In production, upload to Supabase Storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoUrl = reader.result as string;

      // Update return with photo and mark as bagged
      await fetch(`/api/returns/${currentBag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'bagged',
          pickup_photo_urls: [...(currentBag.pickup_photo_urls || []), photoUrl.slice(0, 100) + '...'], // Truncate for storage
        }),
      });

      setUploading(false);
      if (currentBagIndex < bagsToPickup.length - 1) {
        setCurrentBagIndex(currentBagIndex + 1);
      }
      loadBooking();
    };
    reader.readAsDataURL(file);
  };

  const markBagged = async () => {
    if (!currentBag) return;

    await fetch(`/api/returns/${currentBag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'bagged' }),
    });

    if (currentBagIndex < bagsToPickup.length - 1) {
      setCurrentBagIndex(currentBagIndex + 1);
    }
    loadBooking();
  };

  if (loading || !booking) {
    return <main className="p-4"><p>Loading...</p></main>;
  }

  const allDone = bagsToPickup.every(b => b.status === 'bagged');

  return (
    <main className="p-4">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-4">
        ← Back to run sheet
      </button>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <h1 className="font-bold text-lg">{booking.customer_name}</h1>
        <p className="text-gray-600 text-sm">{booking.address}</p>
        {booking.access_notes && (
          <p className="text-yellow-700 bg-yellow-50 text-sm mt-2 p-2 rounded">
            {booking.access_notes}
          </p>
        )}
      </div>

      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Bag {currentBagIndex + 1} of {bagsToPickup.length}
        </p>
      </div>

      {allDone ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium">All bags collected!</p>
          <button
            onClick={() => router.push('/operator/run')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to run sheet
          </button>
        </div>
      ) : currentBag ? (
        <div className="bg-white rounded-lg border p-4">
          <div className="text-center mb-4">
            <p className="text-4xl font-mono font-bold">#{currentBag.bag_number}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Items:</p>
            <ul className="text-sm">
              {currentBag.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 border rounded"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {currentBag.destination && (
            <p className="text-sm text-gray-500 mb-4">
              → {currentBag.destination}
            </p>
          )}

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoCapture}
            className="hidden"
          />

          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3 bg-gray-100 rounded-lg font-medium"
            >
              {uploading ? 'Uploading...' : 'Take Photo'}
            </button>

            <button
              onClick={markBagged}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium"
            >
              Mark Collected
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No bags to pick up</p>
      )}

      <div className="mt-6">
        <h3 className="font-medium mb-2">All bags for this stop</h3>
        <div className="flex flex-wrap gap-2">
          {booking.returns.filter(r => r.bag_number).map((r, i) => (
            <button
              key={r.id}
              onClick={() => {
                const idx = bagsToPickup.findIndex(b => b.id === r.id);
                if (idx >= 0) setCurrentBagIndex(idx);
              }}
              className={`px-3 py-1 rounded font-mono text-sm ${
                r.status === 'bagged'
                  ? 'bg-green-100 text-green-800'
                  : currentBag?.id === r.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              #{r.bag_number}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
