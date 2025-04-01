-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "performedById" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_id_key" ON "activity_logs"("id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_date_key" ON "activity_logs"("date");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
