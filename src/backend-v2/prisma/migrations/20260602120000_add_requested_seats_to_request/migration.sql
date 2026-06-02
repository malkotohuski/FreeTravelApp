ALTER TABLE "Request"
ADD COLUMN "requestedSeats" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Request"
ADD CONSTRAINT "Request_requestedSeats_check"
CHECK ("requestedSeats" >= 1 AND "requestedSeats" <= 60);
