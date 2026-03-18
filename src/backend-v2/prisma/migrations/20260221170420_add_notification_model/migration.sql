-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "requester" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
