-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_routeId_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "routeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "seekerRequestId" INTEGER,
ALTER COLUMN "routeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_seekerRequestId_fkey" FOREIGN KEY ("seekerRequestId") REFERENCES "SeekerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
