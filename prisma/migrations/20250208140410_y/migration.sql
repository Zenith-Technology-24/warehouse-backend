/*
  Warnings:

  - Added the required column `updated_at` to the `issuance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "endUserId" TEXT;

-- AlterTable
ALTER TABLE "issuance" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endUserId" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "end_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "end_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "end_user_id_key" ON "end_user"("id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "end_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuance" ADD CONSTRAINT "issuance_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "end_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
