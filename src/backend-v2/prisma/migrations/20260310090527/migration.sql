-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "driverRated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passengerRated" BOOLEAN NOT NULL DEFAULT false;
