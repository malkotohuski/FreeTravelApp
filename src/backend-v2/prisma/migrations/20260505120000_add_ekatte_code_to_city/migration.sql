ALTER TABLE "City"
ADD COLUMN "ekatteCode" TEXT;

DROP INDEX IF EXISTS "City_name_key";

CREATE UNIQUE INDEX "City_ekatteCode_key" ON "City"("ekatteCode");
CREATE INDEX "City_name_region_idx" ON "City"("name", "region");
