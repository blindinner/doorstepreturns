'use client';

import { useState, useEffect, useRef } from 'react';
import type { Return, Booking } from '@/lib/types';

interface ReturnWithBooking extends Return {
  booking: Booking;
}

export default function DropoffPage() {
  const [bagNumber, setBagNumber] = useState('');
  const [currentReturn, setCurrentReturn] = useState<ReturnWithBooking | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus back on input when QR is dismissed
  useEffect(() => {
    if (!showQR && !currentReturn) {
      inputRef.current?.focus();
    }
  }, [showQR, currentReturn]);

  const lookupBag = async () => {
    if (!bagNumber.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/returns?bag_number=${encodeURIComponent(bagNumber.trim())}`);
      if (!res.ok) {
        setError('Bag not found');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCurrentReturn(data);
      setShowQR(true);
    } catch {
      setError('Lookup failed');
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      lookupBag();
    }
  };

  const markDropped = async () => {
    if (!currentReturn || !trackingNumber.trim()) return;

    setLoading(true);
    await fetch(`/api/returns/${currentReturn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'dropped',
        tracking_number: trackingNumber.trim(),
      }),
    });

    // Reset for next bag
    setBagNumber('');
    setTrackingNumber('');
    setCurrentReturn(null);
    setShowQR(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  const cancel = () => {
    setCurrentReturn(null);
    setShowQR(false);
    setTrackingNumber('');
    setBagNumber('');
    inputRef.current?.focus();
  };

  // QR full screen display
  if (showQR && currentReturn) {
    return (
      <main className="fixed inset-0 bg-white flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <p className="font-mono text-lg">Bag #{currentReturn.bag_number}</p>
            <p className="text-sm text-gray-600">{currentReturn.booking.customer_name}</p>
          </div>
          <button onClick={cancel} className="text-gray-500">
            Cancel
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-white qr-display">
          {currentReturn.qr_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentReturn.qr_image_url}
              alt="QR Code"
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <p className="text-gray-500">No QR image</p>
              </div>
              <p className="text-sm text-gray-600">
                {currentReturn.items.join(', ')}
              </p>
              {currentReturn.destination && (
                <p className="text-sm font-medium mt-2">{currentReturn.destination}</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">After scanning, enter tracking number:</p>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            autoFocus
            className="w-full px-4 py-3 border rounded-lg text-lg font-mono mb-2"
          />
          <button
            onClick={markDropped}
            disabled={!trackingNumber.trim() || loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Drop-off'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-6">Drop-off</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Enter bag number from sticker
        </label>
        <input
          ref={inputRef}
          type="text"
          value={bagNumber}
          onChange={(e) => setBagNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 047"
          autoFocus
          inputMode="numeric"
          className="w-full px-4 py-4 border-2 rounded-lg text-2xl font-mono text-center"
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <button
        onClick={lookupBag}
        disabled={!bagNumber.trim() || loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Looking up...' : 'Find Bag'}
      </button>

      <p className="mt-8 text-sm text-gray-500 text-center">
        Read the sticker number off the physical bag first.<br />
        The QR will appear after lookup.
      </p>
    </main>
  );
}
