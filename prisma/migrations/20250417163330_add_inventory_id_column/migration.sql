-- AlterTable
ALTER TABLE "returnedItems" ADD COLUMN     "inventoryId" TEXT;

-- AddForeignKey
ALTER TABLE "returnedItems" ADD CONSTRAINT "returnedItems_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
