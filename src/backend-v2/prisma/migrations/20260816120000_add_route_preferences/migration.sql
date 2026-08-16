ALTER TABLE "Route"
ADD COLUMN "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ridePreference" TEXT NOT NULL DEFAULT 'conversation',
ADD COLUMN "luggageSize" TEXT NOT NULL DEFAULT 'small',
ADD COLUMN "priceType" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "estimatedPrice" INTEGER;
