'use client';

import Link from 'next/link';
import { useState } from 'react';
import { parseJsonResponse } from '@/lib/utils';

export default function LookupPageClient() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<{
    id: string;
    reference: string;
    name: string;
    email: string;
    phone?: string | null;
    note?: string | null;
    startTime: string;
    endTime: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookupBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/lookup?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`);
      const data = (await parseJsonResponse<{ booking?: any; error?: string }>(response)) ?? {};
      if (!response.ok) {
        throw new Error(data.error || 'Booking not found.');
      }
      setBooking(data.booking);
    } catch (err) {
      setBooking(null);
      setError(err instanceof Error ? err.message : 'Unable to look up booking.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;
    const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: booking.reference, email: booking.email }),
    });
    const data = (await parseJsonResponse<{ error?: string }>(response)) ?? {};
    if (!response.ok) {
      setError(data.error || 'Unable to cancel booking.');
      return;
    }
    setBooking({ ...booking, status: 'CANCELLED' });
    setError(null);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Manage booking</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Lookup booking</h1>
        </div>
        <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Back to booking
        </Link>
      </div>

      <div className="glass rounded-2xl p-6">
        <form onSubmit={lookupBooking} className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Booking reference
            <input
              required
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="BK-7F3K9Q"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Looking up…' : 'Lookup booking'}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {booking && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Booking</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{booking.reference}</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                  booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {booking.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Name</dt>
                <dd className="mt-1 font-medium text-slate-900">{booking.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="mt-1 font-medium text-slate-900">{booking.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Phone</dt>
                <dd className="mt-1 font-medium text-slate-900">{booking.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Note</dt>
                <dd className="mt-1 font-medium text-slate-900">{booking.note || 'No note'}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Starts</dt>
                <dd className="mt-1 font-medium text-slate-900">{new Date(booking.startTime).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Ends</dt>
                <dd className="mt-1 font-medium text-slate-900">{new Date(booking.endTime).toLocaleString()}</dd>
              </div>
            </dl>

            {booking.status === 'CONFIRMED' && (
              <button
                type="button"
                onClick={cancelBooking}
                className="mt-6 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Cancel booking
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
