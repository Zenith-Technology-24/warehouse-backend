/*
  Warnings:

  - You are about to drop the `_InventoryToIssuanceDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InventoryToIssuanceDetail" DROP CONSTRAINT "_InventoryToIssuanceDetail_A_fkey";

-- DropForeignKey
ALTER TABLE "_InventoryToIssuanceDetail" DROP CONSTRAINT "_InventoryToIssuanceDetail_B_fkey";

-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "issuanceId" TEXT;

-- DropTable
DROP TABLE "_InventoryToIssuanceDetail";

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "issuances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
