-- DropForeignKey
ALTER TABLE "issuance_details" DROP CONSTRAINT "issuance_details_inventoryId_fkey";

-- AlterTable
ALTER TABLE "issuance_details" ADD COLUMN     "endUserId" TEXT;

-- CreateTable
CREATE TABLE "_InventoryToIssuanceDetail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventoryToIssuanceDetail_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InventoryToIssuanceDetail_B_index" ON "_InventoryToIssuanceDetail"("B");

-- AddForeignKey
ALTER TABLE "issuance_details" ADD CONSTRAINT "issuance_details_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "end_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryToIssuanceDetail" ADD CONSTRAINT "_InventoryToIssuanceDetail_A_fkey" FOREIGN KEY ("A") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryToIssuanceDetail" ADD CONSTRAINT "_InventoryToIssuanceDetail_B_fkey" FOREIGN KEY ("B") REFERENCES "issuance_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
