-- AlterTable
ALTER TABLE "items" ADD COLUMN     "inventoryTransactionId" TEXT;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_inventoryTransactionId_fkey" FOREIGN KEY ("inventoryTransactionId") REFERENCES "inventory_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
