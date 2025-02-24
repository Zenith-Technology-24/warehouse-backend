-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "inventoryId" TEXT;

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "inventoryId" TEXT;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuances" ADD CONSTRAINT "issuances_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
