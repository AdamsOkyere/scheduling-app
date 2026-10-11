import { Suspense } from 'react';
import BookingSuccessContent from '@/components/booking-success';

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-10">
          <div className="glass w-full rounded-3xl p-8 text-center text-slate-600">Loading booking details…</div>
        </main>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
