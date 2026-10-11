import { addMinutes, isBefore, isSameDay } from 'date-fns';
import { SLOT_MINUTES, WORKING_END_HOUR, WORKING_START_HOUR } from '@/lib/config';

export type GeneratedSlot = {
  id: string;
  start: string;
  end: string;
  label: string;
  available: boolean;
};

export const buildDateFromInput = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const generateSlotsForDay = (dateString: string): GeneratedSlot[] => {
  const baseDate = buildDateFromInput(dateString);
  if (!baseDate) {
    return [];
  }

  const startOfSchedule = new Date(baseDate);
  startOfSchedule.setHours(WORKING_START_HOUR, 0, 0, 0);

  const endOfSchedule = new Date(baseDate);
  endOfSchedule.setHours(WORKING_END_HOUR, 0, 0, 0);

  const slots: GeneratedSlot[] = [];
  let cursor = new Date(startOfSchedule);

  while (cursor < endOfSchedule) {
    const slotEnd = addMinutes(cursor, SLOT_MINUTES);
    if (slotEnd <= endOfSchedule) {
      const startIso = new Date(cursor).toISOString();
      const endIso = new Date(slotEnd).toISOString();
      slots.push({
        id: `${startIso}-${endIso}`,
        start: startIso,
        end: endIso,
        label: `${new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(cursor)} - ${new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(slotEnd)}`,
        available: true,
      });
    }
    cursor = addMinutes(cursor, SLOT_MINUTES);
  }

  return slots;
};

export const isSlotInFuture = (startIso: string) => {
  return new Date(startIso).getTime() > Date.now();
};

export const isSlotInsideWorkingHours = (startIso: string) => {
  const slotStart = new Date(startIso);
  const day = new Date(slotStart);
  const startLimit = new Date(day);
  startLimit.setHours(WORKING_START_HOUR, 0, 0, 0);
  const endLimit = new Date(day);
  endLimit.setHours(WORKING_END_HOUR, 0, 0, 0);
  return slotStart >= startLimit && slotStart < endLimit;
};

export const isSlotAlignedToGrid = (startIso: string) => {
  const slotStart = new Date(startIso);
  return slotStart.getMinutes() % SLOT_MINUTES === 0 && slotStart.getSeconds() === 0;
};

export const isSameDateLocal = (date: Date, other: Date) => isSameDay(date, other);
export const isPastDate = (date: Date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)));
