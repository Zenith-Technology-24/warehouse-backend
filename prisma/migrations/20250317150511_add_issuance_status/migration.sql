-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "issuanceStatus" "ProductStatus" NOT NULL DEFAULT 'pending';
