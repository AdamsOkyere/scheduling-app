import { addMinutes } from 'date-fns';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { isSlotAlignedToGrid, isSlotInFuture, isSlotInsideWorkingHours } from '@/lib/booking';
import { prisma } from '@/lib/prisma';
import { bookingCreateSchema } from '@/lib/schemas';
import { makeBookingReference } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid booking payload.' }, { status: 400 });
    }

    const slotStart = new Date(parsed.data.slotStart);
    const slotEnd = addMinutes(slotStart, 30);

    if (!slotStart || Number.isNaN(slotStart.getTime())) {
      return NextResponse.json({ error: 'The selected slot is invalid.' }, { status: 400 });
    }

    if (!isSlotInFuture(slotStart.toISOString())) {
      return NextResponse.json({ error: 'The selected time has already passed.' }, { status: 400 });
    }

    if (!isSlotInsideWorkingHours(slotStart.toISOString()) || !isSlotAlignedToGrid(slotStart.toISOString())) {
      return NextResponse.json({ error: 'The selected slot is outside the allowed booking grid.' }, { status: 400 });
    }

    const now = new Date();
    const bookingPayload = {
      reference: '',
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      phone: parsed.data.phone?.trim() || null,
      note: parsed.data.note?.trim() || null,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'CONFIRMED' as const,
      createdAt: now,
    };

    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          status: 'CONFIRMED',
          startTime: slotStart,
        },
      });

      if (existing) {
        throw new Error('SLOT_TAKEN');
      }

      let reference = '';
      let attempt = 0;
      while (!reference || attempt < 10) {
        const candidate = makeBookingReference();
        const existingReference = await tx.booking.findUnique({ where: { reference: candidate } });
        if (!existingReference) {
          reference = candidate;
          break;
        }
        attempt += 1;
      }

      if (!reference) {
        throw new Error('REFERENCE_COLLISION');
      }

      return tx.booking.create({
        data: {
          ...bookingPayload,
          reference,
        },
      });
    }, {
      timeout: 20000,
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === 'SLOT_TAKEN') {
        throw Object.assign(new Error('Slot already booked.'), { statusCode: 409 });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw Object.assign(new Error('Slot already booked.'), { statusCode: 409 });
      }
      throw error;
    });

    return NextResponse.json(
      {
        booking: {
          id: created.id,
          reference: created.reference,
          name: created.name,
          email: created.email,
          startTime: created.startTime.toISOString(),
          endTime: created.endTime.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error && error.statusCode === 409) {
      return NextResponse.json({ error: 'This time slot was booked in the meantime. Please try again.' }, { status: 409 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected booking error.' }, { status: 400 });
  }
}
