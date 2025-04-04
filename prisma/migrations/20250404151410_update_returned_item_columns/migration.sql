/*
  Warnings:

  - You are about to drop the column `returned_date_time` on the `returnedItems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "returnedItems" DROP COLUMN "returned_date_time",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "time" TEXT;
