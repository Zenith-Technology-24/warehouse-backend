/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "document_no" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventories_name_key" ON "inventories"("name");
