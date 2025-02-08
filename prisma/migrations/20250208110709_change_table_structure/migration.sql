/*
  Warnings:

  - You are about to drop the column `category` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `in_stock` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `item_name` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `issuance` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `issuance` table. All the data in the column will be lost.
  - Added the required column `amount` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_name` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier` to the `inventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "category",
DROP COLUMN "cost",
DROP COLUMN "in_stock",
DROP COLUMN "product_name",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "item_name" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "supplier" TEXT NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;

-- AlterTable
ALTER TABLE "issuance" DROP COLUMN "amount",
DROP COLUMN "item_name",
DROP COLUMN "location",
DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "size",
DROP COLUMN "status",
DROP COLUMN "supplier";
