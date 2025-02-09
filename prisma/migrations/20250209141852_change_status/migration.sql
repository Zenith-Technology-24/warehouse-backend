/*
  Warnings:

  - The values [active,inactive] on the enum `InventoryStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryStatus_new" AS ENUM ('pending', 'withdrawn');
ALTER TABLE "inventory" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "inventory" ALTER COLUMN "status" TYPE "InventoryStatus_new" USING ("status"::text::"InventoryStatus_new");
ALTER TYPE "InventoryStatus" RENAME TO "InventoryStatus_old";
ALTER TYPE "InventoryStatus_new" RENAME TO "InventoryStatus";
DROP TYPE "InventoryStatus_old";
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'pending';
