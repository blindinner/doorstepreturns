# Doorstep Returns

Amazon return pickup service MVP.

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `schema.sql` to create tables
3. Copy your project URL and keys from Settings > API

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run

```bash
npm install
npm run dev
```

## URLs

- **Customer booking**: http://localhost:3000
- **Operator dashboard**: http://localhost:3000/operator

## Flow

1. Customer books at `/` → gets confirmation at `/confirm/[token]`
2. Customer forwards Amazon return emails (manual process)
3. Operator sees booking in `/operator/inbox`
4. Operator maps returns at `/operator/booking/[id]` (items, destinations, bag numbers, deadlines)
5. Operator views run sheet at `/operator/run`
6. Operator picks up bags at `/operator/pickup/[id]`
7. Operator drops off at `/operator/dropoff` — enters bag number first, then sees QR
8. Customer tracks status at `/status/[token]`

## Key Design Decisions

- **Bag number first**: The drop-off screen requires entering the bag number before showing the QR. This enforces the sticker chain and prevents mix-ups.
- **No customer QR entry**: Customers just forward emails. The operator maps QR codes to bags.
- **One QR = one bag**: Each return record represents one QR code / one bag / one counter transaction.

## Stubs

Payment and SMS are stubbed. Check `lib/payment.ts` and `lib/sms.ts` for integration points.
