/*
  Warnings:

  - Added the required column `receiptRef` to the `returnedItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "returnedItems" ADD COLUMN     "receiptRef" TEXT NOT NULL;
