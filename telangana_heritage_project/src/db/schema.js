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

const heritage¶»§q«^