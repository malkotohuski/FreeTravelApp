/*
  Warnings:

  - A unique constraint covering the columns `[recipientId,routeId,message,status]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientId_routeId_message_status_key" ON "Notification"("recipientId", "routeId", "message", "status");
