/*
  Warnings:

  - You are about to drop the column `issuanceId` on the `end_users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "end_users" DROP CONSTRAINT "end_users_issuanceId_fkey";

-- AlterTable
ALTER TABLE "end_users" DROP COLUMN "issuanceId";

-- CreateTable
CREATE TABLE "_EndUserToIssuance" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EndUserToIssuance_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EndUserToIssuance_B_index" ON "_EndUserToIssuance"("B");

-- AddForeignKey
ALTER TABLE "_EndUserToIssuance" ADD CONSTRAINT "_EndUserToIssuance_A_fkey" FOREIGN KEY ("A") REFERENCES "end_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndUserToIssuance" ADD CONSTRAINT "_EndUserToIssuance_B_fkey" FOREIGN KEY ("B") REFERENCES "issuances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
