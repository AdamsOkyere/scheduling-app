import { addDays } from 'date-fns';
import { prisma } from '../lib/prisma';

async function main() {
  const now = new Date();
  const sampleDates = [1, 2, 3, 5].map((dayOffset) => {
    const date = addDays(now, dayOffset);
    const slot = new Date(date);
    slot.setHours(10, 0, 0, 0);
    return slot;
  });

  const sampleBookings = [
    { name: 'Ana Lopez', email: 'ana@example.com', phone: '555-0101', note: 'Quarterly planning', reference: 'BK-LPZ9Q2' },
    { name: 'Marcus Chen', email: 'marcus@example.com', phone: '555-0102', note: 'Product review', reference: 'BK-CHN2H7' },
    { name: 'Ivy Turner', email: 'ivy@example.com', phone: '555-0103', note: 'Travel setup', reference: 'BK-TRN4K8' },
  ];

  for (const [index, sample] of sampleBookings.entries()) {
    const slotDate = sampleDates[index % sampleDates.length];
    const startTime = new Date(slotDate);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    await prisma.booking.upsert({
      where: { reference: sample.reference },
      update: {
        name: sample.name,
        email: sample.email,
        phone: sample.phone,
        note: sample.note,
        startTime,
        endTime,
      },
      create: {
        reference: sample.reference,
        name: sample.name,
        email: sample.email,
        phone: sample.phone,
        note: sample.note,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });
  }

  console.log('Seeded demo bookings.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
