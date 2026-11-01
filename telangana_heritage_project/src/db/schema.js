"use strict";
const { pgTable, text, uuid, timestamp, jsonb, integer, doublePrecision, index, check } = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const userProfiles = pgTable("user_profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  role: text("role").notNull().default("tourist"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, t => [check("user_profiles_role_check", sql.raw("role in ('tourist','contributor','moderator','admin')"))]);

const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorUserId: text("author_user_id").notNull().references(() => userProfiles.clerkUserId, { onDelete: "cascade" }),
  title: text("title").notNull(), body: text("body").notNull(), language: text("language").notNull().default("en"),
  status: text("status").notNull().default("pending"), reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, t => [
  check("stories_status_check", sql.raw("status in ('pending','published','rejected')")),
  index("stories_status_created_idx").on(t.status,t.createdAt),
  index("stories_author_created_idx").on(t.authorUserId,t.createdAt)
]);

const heritageReports = pgTable("heritage_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterUserId: text("reporter_user_id").notNull().references(() => userProfiles.clerkUserId, { onDelete: "cascade" }),
  destinationSlug: text("destination_slug").notNull(), issueType: text("issue_type").notNull(),
  description: text("description").notNull(), latitude: doublePrecision("latitude"), longitude: doublePrecision("longitude"),
  status: text("status").notNull().default("pending"), priority: text("priority").notNull().default("normal"),
  reviewedBy: text("reviewed_by"), reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, t => [
  check("heritage_reports_status_check", sql.raw("status in ('pending','triaged','resolved','rejected')")),
  check("heritage_reports_priority_check", sql.raw("priority in ('normal','high')")),
  index("heritage_reports_status_created_idx").on(t.status,t.createdAt),
  index("heritage_reports_reporter_created_idx").on(t.reporterUserId,t.createdAt),
  index("heritage_reports_destination_idx").on(t.destinationSlug)
]);

const savedTrips = pgTable("saved_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").notNull().references(() => userProfiles.clerkUserId, { onDelete: "cascade" }),
  title: text("title").notNull(), destination: text("destination").notNull(),
  durationDays: integer("duration_days").notNull(), interest: text("interest").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, t => [
  check("saved_trips_duration_check", sql.raw("duration_days between 1 and 7")),
  index("saved_trips_owner_created_idx").on(t.ownerUserId,t.createdAt)
]);

const contributorRequests = pgTable("contributor_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => userProfiles.clerkUserId, { onDelete: "cascade" }),
  reason: text("reason").notNull(), status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"), reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => [
  check("contributor_requests_status_check", sql.raw("status in ('pending','approved','rejected')")),
  index("contributor_requests_status_created_idx").on(t.status,t.createdAt),
  index("contributor_requests_user_created_idx").on(t.userId,t.createdAt)
]);

const moderationEvents = pgTable("moderation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id").notNull().references(() => userProfiles.clerkUserId),
  targetType: text("target_type").notNull(), targetId: text("target_id").notNull(),
  action: text("action").notNull(), notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => [
  index("moderation_events_target_idx").on(t.targetType,t.targetId,t.createdAt),
  index("moderation_events_actor_idx").on(t.actorUserId,t.createdAt)
]);

const rateLimitBuckets = pgTable("rate_limit_buckets", {
  keyHash: text("key_hash").primaryKey(), count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull()
});

module.exports = { userProfiles, stories, heritageReports, savedTrips, contributorRequests, moderationEvents, rateLimitBuckets };
