/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `issuances` table. All the data in the column will be lost.
  - You are about to drop the column `issuanceDetailId` on the `issuances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "issuances" DROP CONSTRAINT "issuances_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "issuances" DROP CONSTRAINT "issuances_issuanceDetailId_fkey";

-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "issuanceId" TEXT,
ADD COLUMN     "receiptRef" TEXT;

-- AlterTable
ALTER TABLE "issuance_details" ALTER COLUMN "quantity" SET DEFAULT '1';

-- AlterTable
ALTER TABLE "issuances" DROP COLUMN "inventoryId",
DROP COLUMN "issuanceDetailId",
ALTER COLUMN "status" SET DEFAULT 'active';

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "issuances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_details" ADD CONSTRAINT "issuance_details_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_details" ADD CONSTRAINT "issuance_details_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "issuances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
