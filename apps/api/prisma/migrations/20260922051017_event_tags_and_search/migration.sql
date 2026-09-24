-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "event_tags" (
    "event_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "event_tags_pkey" PRIMARY KEY ("event_id","tag")
);

-- CreateIndex
CREATE INDEX "event_tags_tag_idx" ON "event_tags"("tag");

-- CreateIndex
CREATE INDEX "events_created_at_id_idx" ON "events"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "events_title_idx" ON "events" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "events_description_idx" ON "events" USING GIN ("description" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
