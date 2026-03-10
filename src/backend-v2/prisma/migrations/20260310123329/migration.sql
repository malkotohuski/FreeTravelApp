/*
  Warnings:

  - You are about to drop the column `driverRated` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `passengerRated` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `routeId` on the `SeekerRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "driverRated",
DROP COLUMN "passengerRated";

-- AlterTable
ALTER TABLE "SeekerRequest" DROP COLUMN "routeId";
