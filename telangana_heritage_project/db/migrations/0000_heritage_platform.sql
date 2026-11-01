CREATE TABLE IF NOT EXISTS "user_profiles" (
  "clerk_user_id" text PRIMARY KEY NOT NULL,
  "role" text DEFAULT 'tourist' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_profiles_role_check" CHECK ("role" IN ('tourist','contributor','moderator','admin'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "language" text DEFAULT 'en' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "stories_status_check" CHECK ("status" IN ('pending','published','rejected'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_status_created_idx" ON "stories" ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_author_created_idx" ON "stories" ("author_user_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heritage_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id") ON DELETE CASCADE,
  "destination_slug" text NOT NULL,
  "issue_type" text NOT NULL,
  "description" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "status" text DEFAULT 'pending' NOT NULL,
  "priority" text DEFAULT 'normal' NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "heritage_reports_status_check" CHECK ("status" IN ('pending','triaged','resolved','rejected')),
  CONSTRAINT "heritage_reports_priority_check" CHECK ("priority" IN ('normal','high'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heritage_reports_status_created_idx" ON "heritage_reports" ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heritage_reports_reporter_created_idx" ON "heritage_reports" ("reporter_user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heritage_reports_destination_idx" ON "heritage_reports" ("destination_slug");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_trips" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "destination" text NOT NULL,
  "duration_days" integer NOT NULL,
  "interest" text NOT NULL,
  "itinerary" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "saved_trips_duration_check" CHECK ("duration_days" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_trips_owner_created_idx" ON "saved_trips" ("owner_user_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contributor_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "contributor_requests_status_check" CHECK ("status" IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributor_requests_status_created_idx" ON "contributor_requests" ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributor_requests_user_created_idx" ON "contributor_requests" ("user_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" text NOT NULL REFERENCES "user_profiles"("clerk_user_id"),
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "action" text NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_events_target_idx" ON "moderation_events" ("target_type","target_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_events_actor_idx" ON "moderation_events" ("actor_user_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key_hash" text PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "reset_at" timestamptz NOT NULL
);
