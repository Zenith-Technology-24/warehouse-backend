/*
  Warnings:

  - You are about to drop the column `issuanceDetailId` on the `inventories` table. All the data in the column will be lost.
  - You are about to drop the column `issuanceId` on the `inventories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_issuanceDetailId_fkey";

-- DropIndex
DROP INDEX "inventories_issuanceId_key";

-- AlterTable
ALTER TABLE "inventories" DROP COLUMN "issuanceDetailId",
DROP COLUMN "issuanceId";
