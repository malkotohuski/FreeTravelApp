-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "arrivalCity" TEXT,
ADD COLUMN     "departureCity" TEXT,
ALTER COLUMN "routeId" DROP NOT NULL;
