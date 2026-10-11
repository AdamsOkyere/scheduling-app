import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingLookupSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = bookingLookupSchema.safeParse({
    reference: searchParams.get('reference'),
    email: searchParams.get('email'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid lookup request.' }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      reference: parsed.data.reference,
      email: parsed.data.email,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  return NextResponse.json({ booking }, { status: 200 });
}
