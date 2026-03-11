-- AlterTable
ALTER TABLE "SeekerRequest" ADD COLUMN     "routeId" INTEGER;

-- AddForeignKey
ALTER TABLE "SeekerRequest" ADD CONSTRAINT "SeekerRequest_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
