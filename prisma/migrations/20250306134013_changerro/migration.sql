-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_itemId_fkey";

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
