-- CreateEnum
CREATE TYPE "ReturnedItemStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "returnedItems" ADD COLUMN     "status" "ReturnedItemStatus" NOT NULL DEFAULT 'active';
