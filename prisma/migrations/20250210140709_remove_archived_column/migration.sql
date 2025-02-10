/*
  Warnings:

  - You are about to drop the column `is_archived` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `is_archived` on the `issuance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "is_archived";

-- AlterTable
ALTER TABLE "issuance" DROP COLUMN "is_archived";
