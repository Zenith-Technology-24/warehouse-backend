-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
