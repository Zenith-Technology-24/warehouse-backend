/*
  Warnings:

  - The values [APPROVED,REJECTED] on the enum `IssuanceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IssuanceStatus_new" AS ENUM ('PENDING', 'WITHDRAWN');
ALTER TYPE "IssuanceStatus" RENAME TO "IssuanceStatus_old";
ALTER TYPE "IssuanceStatus_new" RENAME TO "IssuanceStatus";
DROP TYPE "IssuanceStatus_old";
COMMIT;
