CREATE UNIQUE INDEX IF NOT EXISTS booking_active_slot
ON "Booking" ("startTime")
WHERE status = 'CONFIRMED';
