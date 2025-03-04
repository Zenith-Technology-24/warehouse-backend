-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_itemId_fkey";

-- AlterTable
ALTER TABLE "inventories" ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
