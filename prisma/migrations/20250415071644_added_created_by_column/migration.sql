-- AlterTable
ALTER TABLE "returnedItems" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "returnedItems" ADD CONSTRAINT "returnedItems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
