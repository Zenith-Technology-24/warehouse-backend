-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "itemId" TEXT;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
