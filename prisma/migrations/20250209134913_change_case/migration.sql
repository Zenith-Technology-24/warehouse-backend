/*
  Warnings:

  - The values [ACTIVE,INACTIVE] on the enum `InventoryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,WITHDRAWN] on the enum `IssuanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,INACTIVE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,INACTIVE] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "inventory" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "inventory" ALTER COLUMN "status" TYPE "InventoryStatus_new" USING ("status"::text::"InventoryStatus_new");
ALTER TYPE "InventoryStatus" RENAME TO "InventoryStatus_old";
ALTER TYPE "InventoryStatus_new" RENAME TO "InventoryStatus";
DROP TYPE "InventoryStatus_old";
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "IssuanceStatus_new" AS ENUM ('pending', 'withdrawn');
ALTER TYPE "IssuanceStatus" RENAME TO "IssuanceStatus_old";
ALTER TYPE "IssuanceStatus_new" RENAME TO "IssuanceStatus";
DROP TYPE "IssuanceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('active', 'inactive');
ALTER TABLE "expense" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "expense" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "expense" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "expense" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active';

-- DropEnum
DROP TYPE "SalesStatus";
