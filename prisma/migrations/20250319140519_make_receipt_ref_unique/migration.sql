/*
  Warnings:

  - A unique constraint covering the columns `[issuance_directive]` on the table `receipts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "receipts_issuance_directive_key" ON "receipts"("issuance_directive");
