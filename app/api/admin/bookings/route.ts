import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ensureAdminAccess = (request: NextRequest) => {
  const headerValue = request.headers.get('x-admin-password');
  const cookieValue = request.cookies.get('admin_password')?.value;
  const supplied = headerValue ?? cookieValue ?? '';
  return supplied === process.env.ADMIN_PASSWORD;
};

export async function GET(request: NextRequest) {
  if (!ensureAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      startTime: {
        gte: new Date(),
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return NextResponse.json({ bookings }, { status: 200 });
}
