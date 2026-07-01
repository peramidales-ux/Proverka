-- Create tables
CREATE TABLE users (
  telegram_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Пользователь',
  username TEXT NOT NULL DEFAULT '',
  banned INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  total_paid INTEGER NOT NULL DEFAULT 0,
  ref_balance INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  tariff TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  key TEXT NOT NULL DEFAULT '',
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_subscriptions_telegram_id ON subscriptions(telegram_id);

CREATE TABLE free_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE premium_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  is_used INTEGER NOT NULL DEFAULT 0,
  used_by TEXT,
  used_at INTEGER
);

CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE referral_counts (
  user_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE support_chats (
  user_id TEXT PRIMARY KEY,
  messages TEXT NOT NULL DEFAULT '[]',
  closed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
