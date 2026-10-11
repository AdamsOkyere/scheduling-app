import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/bookings/route';
import { prisma } from '@/lib/prisma';

const buildRequest = (payload: Record<string, string>) =>
  new Request('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

describe('booking race protection', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany({});
  });

  it('allows exactly one booking when two requests target the same slot', async () => {
    const slotStart = '2030-05-21T09:00:00.000Z';
    const payload = {
      name: 'Alex Example',
      email: 'alex@example.com',
      phone: '555-1111',
      note: 'Test booking',
      slotStart,
    };

    const first = buildRequest(payload) as unknown as NextRequest;
    const second = buildRequest(payload) as unknown as NextRequest;

    const responses = await Promise.all([POST(first), POST(second)]);
    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(1);
  });
});
