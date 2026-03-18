/*
  Warnings:

  - A unique constraint covering the columns `[routeId,user1Id,user2Id]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Conversation_routeId_user1Id_user2Id_key" ON "Conversation"("routeId", "user1Id", "user2Id");
