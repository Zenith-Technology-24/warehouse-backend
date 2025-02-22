/*
  Warnings:

  - The `unit` column on the `inventory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `item_type_id` to the `inventory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SizeType" AS ENUM ('none', 'apparel', 'numerical');

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "item_type_id" TEXT NOT NULL,
DROP COLUMN "unit",
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'sets';

-- DropEnum
DROP TYPE "Units";

-- CreateTable
CREATE TABLE "inventory_item_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size_type" "SizeType" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_item_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" TEXT NOT NULL,
    "directive_no" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_receipt" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_type_id_key" ON "inventory_item_type"("id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_type_name_key" ON "inventory_item_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_id_key" ON "receipt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_receipt_id_key" ON "inventory_receipt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_receipt_inventoryId_receiptId_key" ON "inventory_receipt"("inventoryId", "receiptId");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "inventory_item_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_receipt" ADD CONSTRAINT "inventory_receipt_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_receipt" ADD CONSTRAINT "inventory_receipt_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
