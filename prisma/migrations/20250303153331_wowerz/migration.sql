/*
  Warnings:

  - A unique constraint covering the columns `[issuanceId]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inventoryId]` on the table `issuances` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_issuanceId_fkey";

-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "issuanceDetailId" TEXT;

-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "inventoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventories_issuanceId_key" ON "inventories"("issuanceId");

-- CreateIndex
CREATE UNIQUE INDEX "issuances_inventoryId_key" ON "issuances"("inventoryId");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_issuanceDetailId_fkey" FOREIGN KEY ("issuanceDetailId") REFERENCES "issuance_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuances" ADD CONSTRAINT "issuances_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
