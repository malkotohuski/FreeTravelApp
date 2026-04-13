-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'BG',
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_name_idx" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_normalizedName_idx" ON "City"("normalizedName");

-- CreateIndex
CREATE INDEX "City_isActive_popularity_idx" ON "City"("isActive", "popularity");
