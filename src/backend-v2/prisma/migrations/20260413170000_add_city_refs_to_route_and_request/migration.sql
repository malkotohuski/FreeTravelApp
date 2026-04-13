-- AlterTable
ALTER TABLE "Route"
ADD COLUMN "departureCityId" INTEGER,
ADD COLUMN "arrivalCityId" INTEGER;

-- AlterTable
ALTER TABLE "Request"
ADD COLUMN "departureCityId" INTEGER,
ADD COLUMN "arrivalCityId" INTEGER;

-- CreateIndex
CREATE INDEX "Route_departureCityId_idx" ON "Route"("departureCityId");

-- CreateIndex
CREATE INDEX "Route_arrivalCityId_idx" ON "Route"("arrivalCityId");

-- CreateIndex
CREATE INDEX "Request_departureCityId_idx" ON "Request"("departureCityId");

-- CreateIndex
CREATE INDEX "Request_arrivalCityId_idx" ON "Request"("arrivalCityId");

-- AddForeignKey
ALTER TABLE "Route"
ADD CONSTRAINT "Route_departureCityId_fkey"
FOREIGN KEY ("departureCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route"
ADD CONSTRAINT "Route_arrivalCityId_fkey"
FOREIGN KEY ("arrivalCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_departureCityId_fkey"
FOREIGN KEY ("departureCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_arrivalCityId_fkey"
FOREIGN KEY ("arrivalCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
