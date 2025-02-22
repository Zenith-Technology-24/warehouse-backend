-- CreateTable
CREATE TABLE "issuance_receipt" (
    "id" TEXT NOT NULL,
    "issuanceId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuance_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issuance_receipt_id_key" ON "issuance_receipt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "issuance_receipt_issuanceId_receiptId_key" ON "issuance_receipt"("issuanceId", "receiptId");

-- AddForeignKey
ALTER TABLE "issuance_receipt" ADD CONSTRAINT "issuance_receipt_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "issuance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance_receipt" ADD CONSTRAINT "issuance_receipt_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
