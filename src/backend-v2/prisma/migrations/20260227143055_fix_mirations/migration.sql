/*
  Warnings:

  - You are about to drop the column `recipientId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `recipient` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requester` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "recipientId",
ADD COLUMN     "personalMessage" TEXT,
ADD COLUMN     "recipient" TEXT NOT NULL,
ADD COLUMN     "requester" JSONB NOT NULL,
ALTER COLUMN "conversationId" SET DATA TYPE TEXT;
