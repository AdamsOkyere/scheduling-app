'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WORKING_END_HOUR, WORKING_START_HOUR } from '@/lib/config';
import { parseJsonResponse } from '@/lib/utils';

export type Slot = {
  id: string;
  start: string;
  end: string;
  available: boolean;
  label: string;
};

type Toast = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

const dateFormatter = (value: Date) => format(value, 'yyyy-MM-dd');

export default function BookingPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(dateFormatter(today));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    note: '',
  });

  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ id: Date.now(), type, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const refreshSlots = useCallback(
    async (dateValue = selectedDate) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/slots?date=${dateValue}`);
        const data = (await parseJsonResponse<{ slots?: Slot[]; error?: string }>(response)) ?? {};
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load slots.');
        }
        setSlots(data.slots || []);
        setSelectedSlot(null);
        setIsModalOpen(false);
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Unable to load slots.');
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, showToast],
  );

  useEffect(() => {
    void refreshSlots(selectedDate);
  }, [selectedDate, refreshSlots]);

  const dateOptions = useMemo(() => {
    return Array.from({ length: 30 }, (_, idx) => addDays(today, idx));
  }, [today]);

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot) {
      showToast('error', 'Select an available time slot first.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          slotStart: selectedSlot.start,
        }),
      });
      const data = (await parseJsonResponse<{ booking?: { reference: string }; error?: string }>(response)) ?? {};

      if (!response.ok) {
        if (response.status === 409) {
          showToast('error', 'That slot was just booked by someone else. We refreshed the availability list.');
          await refreshSlots();
          return;
        }
        throw new Error(data.error || 'Unable to complete the booking.');
      }

      router.push(`/success?reference=${encodeURIComponent(data.booking.reference)}`);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const dateMin = dateFormatter(today);
  const dateMax = dateFormatter(addDays(today, 30));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Simple booking</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Choose your time</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/lookup"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            Lookup booking
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-900 hover:bg-slate-700"
          >
            Admin
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="glass rounded-2xl p-4 md:p-5">
          <label htmlFor="date" className="mb-3 block text-sm font-medium text-slate-700">
            Select a date
          </label>
          <input
            id="date"
            type="date"
            min={dateMin}
            max={dateMax}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-sky-400"
          />

          <div className="mt-5 space-y-2">
            {dateOptions.map((day) => {
              const value = dateFormatter(day);
              const isSelected = value === selectedDate;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDate(value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <span>{format(day, 'EEE')}</span>
                  <span>{format(day, 'MMM d')}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="glass rounded-2xl p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Available slots</h2>
              <p className="text-sm text-slate-500">
                {format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMMM d')}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {WORKING_START_HOUR}:00-{WORKING_END_HOUR}:00
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-14 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              No available slots on this date. Try another day or check back later.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const isDisabled = !slot.available;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isDisabled}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedSlot(slot);
                        setIsModalOpen(true);
                      }
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : isSelected
                          ? 'border-sky-500 bg-sky-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{slot.label}</div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em]">
                      {isDisabled ? 'Booked' : 'Available'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedSlot && isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Confirm booking</p>
                <h3 id="booking-modal-title" className="mt-1 text-xl font-bold text-slate-900">
                  {new Date(selectedSlot.start).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSlot(null);
                }}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-sm text-slate-600"
                aria-label="Close booking form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitBooking} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    value={formState.name}
                    onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input
                    required
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Phone (optional)
                  <input
                    value={formState.phone}
                    onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Note (optional)
                  <textarea
                    rows={3}
                    value={formState.note}
                    onChange={(event) => setFormState({ ...formState, note: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400"
                  />
                </label>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Summary:</span> {new Date(selectedSlot.start).toLocaleDateString(undefined, { dateStyle: 'medium' })} ·{' '}
                {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(selectedSlot.start))} to{' '}
                {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(selectedSlot.end))}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSlot(null);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Booking…' : 'Confirm booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
