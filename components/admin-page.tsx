'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type AdminBooking = {
  id: string;
  reference: string;
  name: string;
  email: string;
  startTime: string;
  endTime: string;
  status: string;
};

export default function AdminPageClient() {
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(
    async (passwordValue = password) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/bookings', {
          headers: {
            'X-Admin-Password': passwordValue,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unauthorized');
        }
        setBookings(data.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load bookings.');
      } finally {
        setLoading(false);
      }
    },
    [password],
  );

  useEffect(() => {
    const cookiePassword = document.cookie
      .split('; ')
      .find((item) => item.startsWith('admin_password='));

    if (cookiePassword) {
      const value = decodeURIComponent(cookiePassword.split('=')[1] || '');
      setPassword(value);
      void loadBookings(value);
    }
  }, [loadBookings]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    document.cookie = `admin_password=${encodeURIComponent(password)}; path=/; max-age=3600`;
    await loadBookings();
  };

  const cancelBooking = async (id: string) => {
    const response = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ reference: '', email: '' }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to cancel booking.');
      return;
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === id ? { ...booking, status: 'CANCELLED' } : booking,
      ),
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Upcoming bookings</h1>
        </div>
        <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Home
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Admin password"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400"
        />
        <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
          Unlock admin
        </button>
      </form>

      {error && <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading bookings…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{booking.reference}</td>
                  <td className="px-4 py-3">{booking.name}</td>
                  <td className="px-4 py-3">{booking.email}</td>
                  <td className="px-4 py-3">{new Date(booking.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {booking.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-500">No upcoming bookings found.</div>
          )}
        </div>
      )}
    </main>
  );
}
