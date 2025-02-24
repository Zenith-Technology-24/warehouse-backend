/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `issuances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "issuances" DROP CONSTRAINT "issuances_inventoryId_fkey";

-- AlterTable
ALTER TABLE "issuance_details" ADD COLUMN     "inventoryId" TEXT;

-- AlterTable
ALTER TABLE "issuances" DROP COLUMN "inventoryId";

-- AddForeignKey
ALTER TABLE "issuance_details" ADD CONSTRAINT "issuance_details_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
