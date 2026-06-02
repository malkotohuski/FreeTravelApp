ALTER TABLE "Route"
ADD COLUMN "totalSeats" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "availableSeats" INTEGER NOT NULL DEFAULT 1;

WITH approved AS (
  SELECT "routeId", COUNT(*)::INTEGER AS "approvedCount"
  FROM "Request"
  WHERE "routeId" IS NOT NULL AND "status" = 'approved'
  GROUP BY "routeId"
)
UPDATE "Route" AS route
SET
  "totalSeats" = GREATEST(1, approved."approvedCount"),
  "availableSeats" = GREATEST(
    0,
    GREATEST(1, approved."approvedCount") - approved."approvedCount"
  )
FROM approved
WHERE route."id" = approved."routeId";

ALTER TABLE "Route"
ADD CONSTRAINT "Route_totalSeats_check"
CHECK ("totalSeats" >= 1 AND "totalSeats" <= 60);

ALTER TABLE "Route"
ADD CONSTRAINT "Route_availableSeats_check"
CHECK ("availableSeats" >= 0 AND "availableSeats" <= "totalSeats");
