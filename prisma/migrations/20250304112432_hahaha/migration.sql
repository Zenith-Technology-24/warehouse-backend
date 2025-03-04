/*
  Warnings:

  - You are about to drop the `_ItemToReceipt` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[receiptId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_ItemToReceipt" DROP CONSTRAINT "_ItemToReceipt_A_fkey";

-- DropForeignKey
ALTER TABLE "_ItemToReceipt" DROP CONSTRAINT "_ItemToReceipt_B_fkey";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "receiptId" TEXT;

-- DropTable
DROP TABLE "_ItemToReceipt";

-- CreateIndex
CREATE UNIQUE INDEX "Item_receiptId_key" ON "Item"("receiptId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
