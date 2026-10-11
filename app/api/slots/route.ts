import { addDays, startOfDay } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { generateSlotsForDay } from '@/lib/booking';
import { SLOT_LOOKAHEAD_DAYS } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { dateQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const dateQuery = new URL(request.url).searchParams.get('date');
  const parsed = dateQuerySchema.safeParse({ date: dateQuery });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid date.' }, { status: 400 });
  }

  const requestedDate = new Date(`${parsed.data.date}T00:00:00`);
  const today = startOfDay(new Date());
  const maxDate = addDays(today, SLOT_LOOKAHEAD_DAYS);

  if (requestedDate < today || requestedDate > maxDate) {
    return NextResponse.json({ slots: [] }, { status: 200 });
  }

  const generatedSlots = generateSlotsForDay(parsed.data.date);

  const startOfDayIso = new Date(parsed.data.date + 'T00:00:00').toISOString();
  const endOfDayIso = new Date(parsed.data.date + 'T23:59:59.999').toISOString();

  const booked = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      startTime: {
        gte: new Date(startOfDayIso),
        lte: new Date(endOfDayIso),
      },
    },
    select: {
      startTime: true,
    },
  });

  const bookedSet = new Set(booked.map((item) => new Date(item.startTime).toISOString()));

  const slots = generatedSlots.map((slot) => ({
    ...slot,
    available: !bookedSet.has(slot.start) && new Date(slot.start).getTime() > Date.now(),
  }));

  return NextResponse.json({ slots }, { status: 200 });
}
