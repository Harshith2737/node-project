CREATE TABLE IF NOT EXISTS "travel_memories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id") ON DELETE CASCADE,
  "blob_path" text NOT NULL UNIQUE,
  "content_type" text NOT NULL,
  "file_size" integer NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "destination_name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "travel_memories_content_type_check" CHECK ("content_type" IN ('image/webp','image/jpeg')),
  CONSTRAINT "travel_memories_file_size_check" CHECK ("file_size" BETWEEN 1 AND 2000000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "travel_memories_owner_created_idx" ON "travel_memories" ("owner_user_id","created_at");
