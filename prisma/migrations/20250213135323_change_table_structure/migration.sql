/*
  Warnings:

  - You are about to drop the column `endUserId` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `endUserId` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the `_InventoryToIssuance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InventoryToIssuance" DROP CONSTRAINT "_InventoryToIssuance_A_fkey";

-- DropForeignKey
ALTER TABLE "_InventoryToIssuance" DROP CONSTRAINT "_InventoryToIssuance_B_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_endUserId_fkey";

-- DropForeignKey
ALTER TABLE "issuance" DROP CONSTRAINT "issuance_endUserId_fkey";

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "endUserId";

-- AlterTable
ALTER TABLE "issuance" DROP COLUMN "endUserId";

-- DropTable
DROP TABLE "_InventoryToIssuance";

-- CreateTable
CREATE TABLE "issuance_end_user" (
    "id" TEXT NOT NULL,
    "issuanceId" TEXT NOT NULL,
    "endUserId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuance_end_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issuance_end_user_item" (
    "id" TEXT NOT NULL,
    "issuanceEndUserId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuance_end_user_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issuance_end_user_id_key" ON "issuance_end_user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "issuance_end_user_issuanceId_endUserId_key" ON "issuance_end_user"("issuanceId", "endUserId");

-- CreateIndex
CREATE UNIQUE INDEX "issuance_end_user_item_id_key" ON "issuance_end_user_item"("id");

-- CreateIndex
CREATE UNIQUE INDEX "issuance_end_user_item_issuanceEndUserId_inventoryId_key" ON "issuance_end_user_item"("issuanceEndUserId", "inventoryId");

-- AddForeignKey
ALTER TABLE "issuance_end_user" ADD CONSTRAINT "issuance_end_user_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "issuance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_end_user" ADD CONSTRAINT "issuance_end_user_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "end_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_end_user_item" ADD CONSTRAINT "issuance_end_user_item_issuanceEndUserId_fkey" FOREIGN KEY ("issuanceEndUserId") REFERENCES "issuance_end_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_end_user_item" ADD CONSTRAINT "issuance_end_user_item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
