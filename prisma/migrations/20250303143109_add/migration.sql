-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "quantity" TEXT DEFAULT '0';

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "quantity" TEXT DEFAULT '0';
