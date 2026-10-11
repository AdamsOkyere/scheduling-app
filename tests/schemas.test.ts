import { describe, expect, it } from 'vitest';
import { bookingCreateSchema, bookingLookupSchema } from '@/lib/schemas';

describe('booking schemas', () => {
  it('accepts a valid booking payload', () => {
    const result = bookingCreateSchema.parse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-1010',
      note: 'Follow up',
      slotStart: '2030-01-08T09:00:00.000Z',
    });

    expect(result.name).toBe('Jane Doe');
  });

  it('rejects invalid email and name combinations', () => {
    expect(() =>
      bookingCreateSchema.parse({
        name: 'A',
        email: 'bad-email',
        slotStart: '2030-01-08T09:00:00.000Z',
      }),
    ).toThrow();
  });

  it('validates lookup requests', () => {
    expect(
      bookingLookupSchema.parse({
        reference: 'BK-XYZ123',
        email: 'person@example.com',
      }),
    ).toMatchObject({ reference: 'BK-XYZ123' });
  });
});
