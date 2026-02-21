-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "userFname" TEXT NOT NULL,
    "userLname" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRouteId" INTEGER NOT NULL,
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "dataTime" TIMESTAMP(3) NOT NULL,
    "requestComment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rateCreator" BOOLEAN NOT NULL DEFAULT false,
    "rateUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
