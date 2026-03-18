-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fName" TEXT,
    "lName" TEXT,
    "userImage" TEXT,
    "confirmationCode" TEXT,
    "confirmationCodeExpiresAt" TIMESTAMP(3),
    "lastConfirmationResend" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "routes" JSONB,
    "friends" JSONB,
    "ratings" JSONB,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comments" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
