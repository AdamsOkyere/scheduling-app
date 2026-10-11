# Simple Booking / Scheduling App

A production-style Next.js scheduling app for booking 30-minute appointments, looking up bookings, and managing admin cancellations. It is designed for a Vercel deployment and uses PostgreSQL + Prisma for reliability and concurrency safety.

## Features

- Date-based slot availability with a 30-day booking range
- Business-hour slot grid, configurable in the app config
- Selectable slot confirmation form with summary and validation
- Booking lookup by reference + email
- Cancel booking flow with reference/email verification
- Admin password-protected view of upcoming bookings
- Double-booking prevention with a database-level unique index and transaction handling
- Responsive UI with accessible buttons, forms, and clear booking states

## Tech stack

- Next.js 15 (App Router) with TypeScript
- Tailwind CSS
- PostgreSQL via Prisma ORM
- Zod validation shared across server and client
- date-fns for date/time calculations
- Vitest for unit and concurrency tests
- Vercel deployment target

## Screenshots

Screenshots placeholder:

- Home booking page
- Booking confirmation card
- Booking lookup page
- Admin bookings dashboard

## How double-booking is prevented

The booking model stores start times in UTC. To allow cancelled times to become reusable, the app does not use a blanket `@@unique([startTime])` constraint. Instead, Prisma migrations add a PostgreSQL partial unique index:

```sql
CREATE UNIQUE INDEX booking_active_slot ON "Booking" ("startTime") WHERE status = 'CONFIRMED';
```

This means only active bookings count toward the uniqueness rule. Cancelled rows do not block a slot from being used again. The create-booking route also wraps the insert in a Prisma transaction and catches `P2002` unique violations to return an HTTP 409 to the client, which gives a friendly “slot taken” message and triggers a slot refresh in the UI.

The server-side validation also checks that the requested slot is:

- in the future
- within working hours
- aligned to the 30-minute booking grid

This prevents relying only on the client UI.

## Local setup

Requirements:

- Node.js 20+
- npm
- PostgreSQL database

1. Copy `.env.example` to `.env` and set your database URL and admin password.
2. Install dependencies:

```bash
npm install
```

3. Run the Prisma migration and create the database schema:

```bash
npx prisma migrate dev
```

4. Seed demo bookings:

```bash
npm run seed
```

5. Start the local app:

```bash
npm run dev
```

Open http://localhost:3000

## Environment variables

Use the values in `.env.example`:

- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_PASSWORD`: password required for the admin page

## Project structure

- `app/` – Next.js App Router pages and API routes
- `components/` – booking, lookup, and admin UI components
- `lib/` – configuration, validation, Prisma client, and booking helpers
- `prisma/` – schema and seed scripts
- `tests/` – Vitest coverage for slot generation, validation, and booking race conditions

## Deploying to Vercel

1. Create a PostgreSQL database on Neon or Supabase.
2. Add the environment variables in your Vercel project:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
3. Import the repository into Vercel.
4. Ensure the production database is migrated before launch:

```bash
npx prisma migrate deploy
```

5. Trigger a Vercel deploy. The repository includes a `postinstall` script that runs `prisma generate` so Prisma builds succeed on Vercel.

## Commands

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
npm test
npm run build
```

## Notes

- All booking times are stored in UTC and rendered in the user’s local browser time zone.
- The admin password is checked against the environment variable `ADMIN_PASSWORD`.
