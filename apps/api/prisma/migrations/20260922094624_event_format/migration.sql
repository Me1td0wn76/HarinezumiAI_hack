-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "format" "EventFormat" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "meeting_url" TEXT,
ADD COLUMN     "venue" TEXT;

-- CreateIndex
CREATE INDEX "events_format_idx" ON "events"("format");
