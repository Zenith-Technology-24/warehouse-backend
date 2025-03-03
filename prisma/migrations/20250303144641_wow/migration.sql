/*
  Warnings:

  - You are about to drop the column `unit` on the `inventories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventories" DROP COLUMN "unit",
ADD COLUMN     "quantity" TEXT DEFAULT '0';
