-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "handle" TEXT;

-- 既存ユーザーには仮のハンドルを付ける（開発・テスト用のデータ。本人が /me で変更する）。
-- "test_user_" + id（uuid）の先頭10文字 = 20文字
UPDATE "users" SET "handle" = 'test_user_' || substr(replace("id", '-', ''), 1, 10);

ALTER TABLE "users" ALTER COLUMN "handle" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");
