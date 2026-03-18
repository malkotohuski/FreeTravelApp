-- CreateTable
CREATE TABLE "BugReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT,
    "image" TEXT,
    "appVersion" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "systemVersion" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);
