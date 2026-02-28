/*
  Warnings:

  - Made the column `arrivalCity` on table `Conversation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `departureCity` on table `Conversation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "arrivalCity" SET NOT NULL,
ALTER COLUMN "departureCity" SET NOT NULL;
