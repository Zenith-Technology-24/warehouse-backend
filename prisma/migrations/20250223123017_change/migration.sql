/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `receipts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_inventoryId_fkey";

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "inventoryId";

-- CreateTable
CREATE TABLE "_InventoryToReceipt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventoryToReceipt_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InventoryToReceipt_B_index" ON "_InventoryToReceipt"("B");

-- AddForeignKey
ALTER TABLE "_InventoryToReceipt" ADD CONSTRAINT "_InventoryToReceipt_A_fkey" FOREIGN KEY ("A") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryToReceipt" ADD CONSTRAINT "_InventoryToReceipt_B_fkey" FOREIGN KEY ("B") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
