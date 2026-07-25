export type PickupSlot = 'morning' | 'afternoon' | 'evening';
export type PaymentStatus = 'pending' | 'paid';
export type ReturnStatus = 'pending' | 'bagged' | 'dropped' | 'failed';
export type OrderStatus = 'open' | 'picked_up' | 'returned' | 'cancelled';

export interface PastedEmail {
  id: string;
  content: string;
  pasted_at: string;
}

export interface Booking {
  id: string;
  created_at: string;
  token: string;
  customer_name: string;
  phone: string;
  address: string;
  access_notes: string | null;
  pickup_date: string;
  pickup_slot: PickupSlot;
  emails_received_at: string | null;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  pasted_emails: PastedEmail[];
  order_status: OrderStatus;
}

export interface Return {
  id: string;
  booking_id: string;
  qr_image_url: string | null;
  items: string[];
  destination: string | null;
  bag_number: string | null;
  deadline: string | null;
  status: ReturnStatus;
  tracking_number: string | null;
  pickup_photo_urls: string[];
  receipt_photo_url: string | null;
  created_at: string;
}

export interface BookingWithReturns extends Booking {
  returns: Return[];
}

// Derived booking status based on returns
export function getBookingStatus(booking: BookingWithReturns): string {
  if (!booking.emails_received_at) return 'awaiting_emails';
  if (booking.returns.length === 0) return 'needs_mapping';

  const statuses = booking.returns.map(r => r.status);
  if (statuses.every(s => s === 'dropped')) return 'complete';
  if (statuses.some(s => s === 'failed')) return 'has_failures';
  if (statuses.some(s => s === 'bagged')) return 'in_progress';
  if (statuses.every(s => s === 'pending') && booking.returns.every(r => r.bag_number)) return 'ready_for_pickup';

  return 'needs_mapping';
}
