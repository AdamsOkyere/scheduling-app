'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || 'BK-UNKNOWN';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-10">
      <div className="glass w-full rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Booking confirmed</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Your booking is locked in</h1>
        <p className="mt-3 text-slate-600">Your booking reference is:</p>
        <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-xl font-semibold tracking-[0.12em] text-white">
          {reference}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Book another slot
          </Link>
          <Link
            href="/lookup"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            View booking
          </Link>
        </div>
      </div>
    </main>
  );
}
