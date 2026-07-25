-- Run this in your Supabase SQL editor

-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  token text unique not null,

  customer_name text not null,
  phone text not null,
  address text not null,
  access_notes text,

  pickup_date date not null,
  pickup_slot text not null, -- 'morning' | 'afternoon' | 'evening'

  emails_received_at timestamptz,
  payment_status text default 'pending', -- 'pending' | 'paid'
  payment_ref text
);

-- Returns table (one per QR code)
create table returns (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,

  qr_image_url text,
  items text[], -- array of item descriptions
  destination text,
  bag_number text,
  deadline date,

  status text default 'pending', -- 'pending' | 'bagged' | 'dropped' | 'failed'
  tracking_number text,

  pickup_photo_urls text[],
  receipt_photo_url text,

  created_at timestamptz default now()
);

-- SMS log (for tracking the 3 messages)
create table sms_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  message_type text not null, -- 'confirmation' | 'fifteen_min' | 'complete'
  sent_at timestamptz default now(),
  phone text not null
);

-- Indexes
create index idx_bookings_token on bookings(token);
create index idx_bookings_pickup_date on bookings(pickup_date);
create index idx_returns_booking_id on returns(booking_id);
create index idx_returns_bag_number on returns(bag_number);
create index idx_returns_deadline on returns(deadline);

-- Row Level Security (optional, enable if needed)
-- alter table bookings enable row level security;
-- alter table returns enable row level security;
