-- CreateTable
CREATE TABLE "SeekerRequest" (
    "id" SERIAL NOT NULL,
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "routeTitle" TEXT,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeekerRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SeekerRequest" ADD CONSTRAINT "SeekerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
