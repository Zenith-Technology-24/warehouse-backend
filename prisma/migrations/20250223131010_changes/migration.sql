-- AlterTable
ALTER TABLE "issuances" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "issuances" ADD CONSTRAINT "issuances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
