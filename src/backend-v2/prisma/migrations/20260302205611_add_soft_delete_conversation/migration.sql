-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "hiddenByUser1" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenByUser2" BOOLEAN NOT NULL DEFAULT false;
