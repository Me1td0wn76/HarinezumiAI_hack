/*
  Warnings:

  - You are about to drop the column `body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `data` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- 文面（title / body / link）の保存をやめ、表示用の値を data に持つ形に変える。
-- このテーブルは main に入る前（PR #47 の動作確認中）のものしか無く、旧形式の行は data を組み立てられないため消す
DELETE FROM "notifications";

-- DropIndex
DROP INDEX "notifications_user_id_created_at_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "body",
DROP COLUMN "link",
DROP COLUMN "title",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "event_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_id_idx" ON "notifications"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "notifications_event_id_idx" ON "notifications"("event_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
