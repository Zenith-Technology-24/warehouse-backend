/*
  Warnings:

  - You are about to drop the column `inventoryTransactionId` on the `items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_inventoryTransactionId_fkey";

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "itemId" TEXT;

-- AlterTable
ALTER TABLE "items" DROP COLUMN "inventoryTransactionId";

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
