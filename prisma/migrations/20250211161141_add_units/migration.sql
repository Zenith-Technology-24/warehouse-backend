-- CreateEnum
CREATE TYPE "Units" AS ENUM ('prs', 'ea', 'sets');

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "unit" "Units" NOT NULL DEFAULT 'ea';
