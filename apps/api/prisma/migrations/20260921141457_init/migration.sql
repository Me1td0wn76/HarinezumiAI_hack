-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('OPEN', 'CONFIRMED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('YES', 'MAYBE', 'NO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'OPEN',
    "share_token" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "confirmed_date_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_dates" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_responses" (
    "id" TEXT NOT NULL,
    "event_date_id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_key" TEXT,
    "guest_name" TEXT,
    "availability" "Availability" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_share_token_key" ON "events"("share_token");

-- CreateIndex
CREATE UNIQUE INDEX "events_confirmed_date_id_key" ON "events"("confirmed_date_id");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_status_created_at_idx" ON "events"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_dates_event_id_starts_at_key" ON "event_dates"("event_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "date_responses_event_date_id_user_id_key" ON "date_responses"("event_date_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "date_responses_event_date_id_guest_key_key" ON "date_responses"("event_date_id", "guest_key");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_confirmed_date_id_fkey" FOREIGN KEY ("confirmed_date_id") REFERENCES "event_dates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_responses" ADD CONSTRAINT "date_responses_event_date_id_fkey" FOREIGN KEY ("event_date_id") REFERENCES "event_dates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_responses" ADD CONSTRAINT "date_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
