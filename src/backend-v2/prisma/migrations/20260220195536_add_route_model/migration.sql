/*
  Warnings:

  - You are about to drop the column `routes` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "registrationNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "routes";
