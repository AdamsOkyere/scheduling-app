import { describe, expect, it } from 'vitest';
import { generateSlotsForDay } from '@/lib/booking';

describe('generateSlotsForDay', () => {
  it('creates 16 half-hour slots from 09:00 to 17:00', () => {
    const slots = generateSlotsForDay('2026-10-12');

    expect(slots).toHaveLength(16);
    expect(slots[0]?.start).toBe('2026-10-12T09:00:00.000Z');
    expect(slots[slots.length - 1]?.end).toBe('2026-10-12T17:00:00.000Z');
  });

  it('marks each slot with a human-readable label', () => {
    const slots = generateSlotsForDay('2026-10-14');

    expect(slots[0]?.label).toContain('9:00');
    expect(slots[1]?.label).toContain('9:30');
  });
});
