-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "issuanceDetailId" TEXT;

-- CreateTable
CREATE TABLE "issuance_details" (
    "id" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "issuanceId" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuance_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issuance_details_id_key" ON "issuance_details"("id");

-- AddForeignKey
ALTER TABLE "issuances" ADD CONSTRAINT "issuances_issuanceDetailId_fkey" FOREIGN KEY ("issuanceDetailId") REFERENCES "issuance_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
