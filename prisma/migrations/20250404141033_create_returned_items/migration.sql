-- CreateTable
CREATE TABLE "returnedItems" (
    "id" TEXT NOT NULL,
    "itemName" TEXT,
    "returned_date_time" TIMESTAMP(3) NOT NULL,
    "personnel" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returnedItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "returnedItems_id_key" ON "returnedItems"("id");
