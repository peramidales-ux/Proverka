import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  telegramId: text("telegram_id").primaryKey(),
  name: text("name").notNull().default("Пользователь"),
  username: text("username").notNull().default(""),
  banned: integer("banned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  balance: integer("balance").notNull().default(0),
  totalPaid: integer("total_paid").notNull().default(0),
  refBalance: integer("ref_balance").notNull().default(0),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: text("telegram_id").notNull(),
  tariff: text("tariff").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  key: text("key").notNull().default(""),
  reminderSent: integer("reminder_sent", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  telegramIdIdx: index("telegram_id_idx").on(table.telegramId),
}));

export const freeKeys = sqliteTable("free_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const premiumKeys = sqliteTable("premium_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
  usedBy: text("used_by"),
  usedAt: integer("used_at", { mode: "timestamp" }),
});

export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  inviterId: text("inviter_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const referralCounts = sqliteTable("referral_counts", {
  userId: text("user_id").primaryKey(),
  count: integer("count").notNull().default(0),
});

export const supportChats = sqliteTable("support_chats", {
  userId: text("user_id").primaryKey(),
  messages: text("messages").notNull().default("[]"),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
