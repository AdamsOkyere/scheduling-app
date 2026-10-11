import { z } from 'zod';

export const dateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
});

export const bookingCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(120),
  email: z.string().trim().email('A valid email is required.'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  slotStart: z.string().datetime({ offset: false }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)),
});

export const bookingLookupSchema = z.object({
  reference: z.string().trim().min(1, 'Reference is required.'),
  email: z.string().trim().email('A valid email is required.'),
});

export const cancelBookingSchema = z.object({
  reference: z.string().trim().min(1, 'Reference is required.'),
  email: z.string().trim().email('A valid email is required.'),
});

export const adminAuthSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});
