/*
  Warnings:

  - You are about to drop the column `departureTime` on the `SeekerRequest` table. All the data in the column will be lost.
  - Added the required column `selectedDateTime` to the `SeekerRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmail` to the `SeekerRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userFname` to the `SeekerRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userLname` to the `SeekerRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `SeekerRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `routeTitle` on table `SeekerRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SeekerRequest" DROP CONSTRAINT "SeekerRequest_userId_fkey";

-- AlterTable
ALTER TABLE "SeekerRequest" DROP COLUMN "departureTime",
ADD COLUMN     "selectedDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "userEmail" TEXT NOT NULL,
ADD COLUMN     "userFname" TEXT NOT NULL,
ADD COLUMN     "userImage" TEXT,
ADD COLUMN     "userLname" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "routeTitle" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SeekerRequest" ADD CONSTRAINT "SeekerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
