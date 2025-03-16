/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_receiptId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_itemId_fkey";

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "Token";

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "size" TEXT,
    "unit" TEXT,
    "receiptRef" TEXT,
    "quantity" TEXT,
    "expiry_date" TIMESTAMP(3),
    "price" TEXT,
    "amount" TEXT,
    "inventoryId" TEXT,
    "receiptId" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT,
    "refreshToken" TEXT,
    "resetToken" TEXT,
    "expires_at" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_id_key" ON "items"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_id_key" ON "tokens"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_userId_key" ON "tokens"("userId");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
