/*
  Warnings:

  - You are about to drop the column `personalMessage` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `requester` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `recipientId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "personalMessage",
DROP COLUMN "recipient",
DROP COLUMN "requester",
ADD COLUMN     "conversationId" INTEGER,
ADD COLUMN     "recipientId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
