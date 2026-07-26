import { createClient } from '@libsql/client';
import type { Booking, Return, PastedEmail, OrderStatus } from './types';

// Initialize Turso client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables on first load
let initialized = false;

async function initDb() {
  if (initialized) return;

  await turso.batch([
    `CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      access_notes TEXT,
      pickup_date TEXT NOT NULL,
      pickup_slot TEXT NOT NULL,
      emails_received_at TEXT,
      payment_status TEXT DEFAULT 'pending',
      payment_ref TEXT,
      order_status TEXT DEFAULT 'open'
    )`,
    `CREATE TABLE IF NOT EXISTS pasted_emails (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      content TEXT NOT NULL,
      pasted_at TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )`,
    `CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      qr_image_url TEXT,
      items TEXT,
      destination TEXT,
      bag_number TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'pending',
      tracking_number TEXT,
      pickup_photo_urls TEXT,
      receipt_photo_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )`,
    `CREATE TABLE IF NOT EXISTS pending_emails (
      id TEXT PRIMARY KEY,
      sender_email TEXT NOT NULL,
      content TEXT NOT NULL,
      received_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(token)`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email)`,
    `CREATE INDEX IF NOT EXISTS idx_returns_booking ON returns(booking_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pasted_emails_booking ON pasted_emails(booking_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pending_emails_sender ON pending_emails(sender_email)`,
  ]);

  initialized = true;
}

// Helper to convert row to Booking
function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    token: row.token as string,
    customer_name: row.customer_name as string,
    phone: row.phone as string,
    address: row.address as string,
    access_notes: row.access_notes as string | null,
    pickup_date: row.pickup_date as string,
    pickup_slot: row.pickup_slot as 'morning' | 'afternoon' | 'evening',
    emails_received_at: row.emails_received_at as string | null,
    payment_status: (row.payment_status as 'pending' | 'paid') || 'pending',
    payment_ref: row.payment_ref as string | null,
    order_status: (row.order_status as OrderStatus) || 'open',
    pasted_emails: [],
  };
}

function rowToReturn(row: Record<string, unknown>): Return {
  return {
    id: row.id as string,
    booking_id: row.booking_id as string,
    qr_image_url: row.qr_image_url as string | null,
    items: row.items ? JSON.parse(row.items as string) : [],
    destination: row.destination as string | null,
    bag_number: row.bag_number as string | null,
    deadline: row.deadline as string | null,
    status: (row.status as Return['status']) || 'pending',
    tracking_number: row.tracking_number as string | null,
    pickup_photo_urls: row.pickup_photo_urls ? JSON.parse(row.pickup_photo_urls as string) : [],
    receipt_photo_url: row.receipt_photo_url as string | null,
    created_at: row.created_at as string,
  };
}

function rowToPastedEmail(row: Record<string, unknown>): PastedEmail {
  return {
    id: row.id as string,
    content: row.content as string,
    pasted_at: row.pasted_at as string,
  };
}

export const db = {
  // Bookings
  async getBookings(): Promise<Booking[]> {
    await initDb();
    const result = await turso.execute('SELECT * FROM bookings ORDER BY created_at DESC');
    const bookings = result.rows.map(row => rowToBooking(row as Record<string, unknown>));

    // Load pasted_emails for each booking
    for (const booking of bookings) {
      const emails = await turso.execute({
        sql: 'SELECT * FROM pasted_emails WHERE booking_id = ?',
        args: [booking.id],
      });
      booking.pasted_emails = emails.rows.map(row => rowToPastedEmail(row as Record<string, unknown>));
    }

    return bookings;
  },

  async getBooking(idOrToken: string): Promise<Booking | null> {
    await initDb();
    const result = await turso.execute({
      sql: 'SELECT * FROM bookings WHERE id = ? OR token = ?',
      args: [idOrToken, idOrToken],
    });

    if (result.rows.length === 0) return null;

    const booking = rowToBooking(result.rows[0] as Record<string, unknown>);

    // Load pasted_emails
    const emails = await turso.execute({
      sql: 'SELECT * FROM pasted_emails WHERE booking_id = ?',
      args: [booking.id],
    });
    booking.pasted_emails = emails.rows.map(row => rowToPastedEmail(row as Record<string, unknown>));

    return booking;
  },

  async getBookingByEmail(email: string): Promise<Booking | null> {
    await initDb();
    const result = await turso.execute({
      sql: 'SELECT * FROM bookings WHERE customer_email = ? ORDER BY created_at DESC LIMIT 1',
      args: [email.toLowerCase()],
    });

    if (result.rows.length === 0) return null;

    const booking = rowToBooking(result.rows[0] as Record<string, unknown>);

    const emails = await turso.execute({
      sql: 'SELECT * FROM pasted_emails WHERE booking_id = ?',
      args: [booking.id],
    });
    booking.pasted_emails = emails.rows.map(row => rowToPastedEmail(row as Record<string, unknown>));

    return booking;
  },

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'pasted_emails'> & { customer_email?: string }): Promise<Booking> {
    await initDb();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO bookings (id, created_at, token, customer_name, customer_email, phone, address, access_notes, pickup_date, pickup_slot, emails_received_at, payment_status, payment_ref, order_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        created_at,
        booking.token,
        booking.customer_name,
        booking.customer_email?.toLowerCase() || null,
        booking.phone,
        booking.address,
        booking.access_notes,
        booking.pickup_date,
        booking.pickup_slot,
        booking.emails_received_at,
        booking.payment_status,
        booking.payment_ref,
        booking.order_status,
      ],
    });

    return { ...booking, id, created_at, pasted_emails: [] };
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    await initDb();
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.customer_name !== undefined) { fields.push('customer_name = ?'); values.push(updates.customer_name); }
    if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address); }
    if (updates.access_notes !== undefined) { fields.push('access_notes = ?'); values.push(updates.access_notes); }
    if (updates.pickup_date !== undefined) { fields.push('pickup_date = ?'); values.push(updates.pickup_date); }
    if (updates.pickup_slot !== undefined) { fields.push('pickup_slot = ?'); values.push(updates.pickup_slot); }
    if (updates.emails_received_at !== undefined) { fields.push('emails_received_at = ?'); values.push(updates.emails_received_at); }
    if (updates.payment_status !== undefined) { fields.push('payment_status = ?'); values.push(updates.payment_status); }
    if (updates.payment_ref !== undefined) { fields.push('payment_ref = ?'); values.push(updates.payment_ref); }
    if (updates.order_status !== undefined) { fields.push('order_status = ?'); values.push(updates.order_status); }

    if (fields.length === 0) return db.getBooking(id);

    values.push(id);

    await turso.execute({
      sql: `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`,
      args: values,
    });

    return db.getBooking(id);
  },

  async addPastedEmail(bookingIdOrToken: string, content: string): Promise<PastedEmail | null> {
    await initDb();
    const booking = await db.getBooking(bookingIdOrToken);
    if (!booking) return null;

    const id = crypto.randomUUID();
    const pasted_at = new Date().toISOString();

    await turso.execute({
      sql: 'INSERT INTO pasted_emails (id, booking_id, content, pasted_at) VALUES (?, ?, ?, ?)',
      args: [id, booking.id, content, pasted_at],
    });

    // Update emails_received_at
    await turso.execute({
      sql: 'UPDATE bookings SET emails_received_at = ? WHERE id = ? AND emails_received_at IS NULL',
      args: [pasted_at, booking.id],
    });

    return { id, content, pasted_at };
  },

  // Returns
  async getReturns(bookingId?: string): Promise<Return[]> {
    await initDb();
    const result = bookingId
      ? await turso.execute({ sql: 'SELECT * FROM returns WHERE booking_id = ?', args: [bookingId] })
      : await turso.execute('SELECT * FROM returns');

    return result.rows.map(row => rowToReturn(row as Record<string, unknown>));
  },

  async getReturnByBagNumber(bagNumber: string): Promise<(Return & { booking: Booking }) | null> {
    await initDb();
    const result = await turso.execute({
      sql: 'SELECT * FROM returns WHERE bag_number = ?',
      args: [bagNumber],
    });

    if (result.rows.length === 0) return null;

    const ret = rowToReturn(result.rows[0] as Record<string, unknown>);
    const booking = await db.getBooking(ret.booking_id);
    if (!booking) return null;

    return { ...ret, booking };
  },

  async createReturn(ret: Omit<Return, 'id' | 'created_at'>): Promise<Return> {
    await initDb();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO returns (id, booking_id, qr_image_url, items, destination, bag_number, deadline, status, tracking_number, pickup_photo_urls, receipt_photo_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        ret.booking_id,
        ret.qr_image_url,
        JSON.stringify(ret.items),
        ret.destination,
        ret.bag_number,
        ret.deadline,
        ret.status,
        ret.tracking_number,
        JSON.stringify(ret.pickup_photo_urls),
        ret.receipt_photo_url,
        created_at,
      ],
    });

    return { ...ret, id, created_at };
  },

  async updateReturn(id: string, updates: Partial<Return>): Promise<Return | null> {
    await initDb();
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.qr_image_url !== undefined) { fields.push('qr_image_url = ?'); values.push(updates.qr_image_url); }
    if (updates.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(updates.items)); }
    if (updates.destination !== undefined) { fields.push('destination = ?'); values.push(updates.destination); }
    if (updates.bag_number !== undefined) { fields.push('bag_number = ?'); values.push(updates.bag_number); }
    if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.tracking_number !== undefined) { fields.push('tracking_number = ?'); values.push(updates.tracking_number); }
    if (updates.pickup_photo_urls !== undefined) { fields.push('pickup_photo_urls = ?'); values.push(JSON.stringify(updates.pickup_photo_urls)); }
    if (updates.receipt_photo_url !== undefined) { fields.push('receipt_photo_url = ?'); values.push(updates.receipt_photo_url); }

    if (fields.length === 0) return null;

    values.push(id);

    await turso.execute({
      sql: `UPDATE returns SET ${fields.join(', ')} WHERE id = ?`,
      args: values,
    });

    const result = await turso.execute({ sql: 'SELECT * FROM returns WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    return rowToReturn(result.rows[0] as Record<string, unknown>);
  },

  async deleteReturn(id: string): Promise<boolean> {
    await initDb();
    const result = await turso.execute({ sql: 'DELETE FROM returns WHERE id = ?', args: [id] });
    return (result.rowsAffected ?? 0) > 0;
  },

  // Helpers
  async getBookingWithReturns(idOrToken: string) {
    const booking = await db.getBooking(idOrToken);
    if (!booking) return null;
    const returns = await db.getReturns(booking.id);
    return { ...booking, returns };
  },

  async getAllBookingsWithReturns() {
    const bookings = await db.getBookings();
    const result = [];
    for (const booking of bookings) {
      const returns = await db.getReturns(booking.id);
      result.push({ ...booking, returns });
    }
    return result;
  },

  // Pending emails (received before booking exists)
  async storePendingEmail(senderEmail: string, content: string): Promise<void> {
    await initDb();
    const id = crypto.randomUUID();
    const received_at = new Date().toISOString();

    await turso.execute({
      sql: 'INSERT INTO pending_emails (id, sender_email, content, received_at) VALUES (?, ?, ?, ?)',
      args: [id, senderEmail.toLowerCase(), content, received_at],
    });
  },

  async getPendingEmails(senderEmail: string): Promise<{ id: string; content: string; received_at: string }[]> {
    await initDb();
    const result = await turso.execute({
      sql: 'SELECT * FROM pending_emails WHERE sender_email = ? ORDER BY received_at DESC',
      args: [senderEmail.toLowerCase()],
    });

    return result.rows.map(row => ({
      id: row.id as string,
      content: row.content as string,
      received_at: row.received_at as string,
    }));
  },

  async deletePendingEmails(senderEmail: string): Promise<void> {
    await initDb();
    await turso.execute({
      sql: 'DELETE FROM pending_emails WHERE sender_email = ?',
      args: [senderEmail.toLowerCase()],
    });
  },
};
