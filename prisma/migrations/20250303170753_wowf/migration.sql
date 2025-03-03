/*
  Warnings:

  - You are about to drop the column `itemId` on the `receipts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_itemId_fkey";

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "itemId";

-- CreateTable
CREATE TABLE "_ItemToReceipt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemToReceipt_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ItemToReceipt_B_index" ON "_ItemToReceipt"("B");

-- AddForeignKey
ALTER TABLE "_ItemToReceipt" ADD CONSTRAINT "_ItemToReceipt_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToReceipt" ADD CONSTRAINT "_ItemToReceipt_B_fkey" FOREIGN KEY ("B") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
