-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "selectedVehicle" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "departureStreet" TEXT,
    "departureNumber" TEXT,
    "arrivalCity" TEXT NOT NULL,
    "arrivalStreet" TEXT,
    "arrivalNumber" TEXT,
    "selectedDateTime" TIMESTAMP(3) NOT NULL,
    "routeTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_ownerId_idx" ON "Route"("ownerId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
