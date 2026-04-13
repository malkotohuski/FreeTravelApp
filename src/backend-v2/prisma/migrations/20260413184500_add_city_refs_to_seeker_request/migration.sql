ALTER TABLE "SeekerRequest"
ADD COLUMN "departureCityId" INTEGER,
ADD COLUMN "arrivalCityId" INTEGER;

ALTER TABLE "SeekerRequest"
ADD CONSTRAINT "SeekerRequest_departureCityId_fkey"
FOREIGN KEY ("departureCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SeekerRequest"
ADD CONSTRAINT "SeekerRequest_arrivalCityId_fkey"
FOREIGN KEY ("arrivalCityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SeekerRequest_departureCityId_idx" ON "SeekerRequest"("departureCityId");
CREATE INDEX "SeekerRequest_arrivalCityId_idx" ON "SeekerRequest"("arrivalCityId");
