-- CreateEnum
CREATE TYPE "EntryRole" AS ENUM ('SPEAKER', 'AUDIENCE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SPEAKER_ENTERED';

-- CreateTable
CREATE TABLE "event_entries" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "EntryRole" NOT NULL,
    "talk_title" TEXT,
    "talk_detail" TEXT,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_entries_user_id_idx" ON "event_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_entries_event_id_user_id_key" ON "event_entries"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
