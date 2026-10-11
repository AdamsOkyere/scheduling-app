import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelBookingSchema } from '@/lib/schemas';

const getAdminPassword = (request: NextRequest) => {
  const headerPassword = request.headers.get('x-admin-password');
  if (headerPassword) return headerPassword;
  const cookiePassword = request.cookies.get('admin_password')?.value;
  return cookiePassword ?? null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const adminPassword = getAdminPassword(request);
  const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;

  if (!isAdmin) {
    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid cancellation request.' }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        reference: parsed.data.reference,
        email: parsed.data.email,
        status: 'CONFIRMED',
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or already cancelled.' }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ booking: updated }, { status: 200 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ booking: updated }, { status: 200 });
}
