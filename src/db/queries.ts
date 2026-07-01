import { and, eq, gte } from "drizzle-orm";
import type { DbClient } from "./client";
import * as schema from "./schema";

// ============ USERS ============

export async function getOrCreateUser(
  db: DbClient,
  telegramId: number,
  name: string,
  username: string
) {
  const existing = await db.select().from(schema.users).where(eq(schema.users.telegramId, String(telegramId))).get();

  if (existing) {
    return existing;
  }

  const newUser = {
    telegramId: String(telegramId),
    name: name || "Пользователь",
    username: username || "",
    banned: false,
    createdAt: Date.now(),
    balance: 0,
    totalPaid: 0,
    refBalance: 0,
  };

  await db.insert(schema.users).values(newUser);
  return newUser;
}

export async function getUser(db: DbClient, telegramId: number) {
  return db.select().from(schema.users).where(eq(schema.users.telegramId, String(telegramId))).get();
}

export async function getAllUsers(db: DbClient) {
  return db.select().from(schema.users);
}

export async function getActiveUsers(db: DbClient) {
  return db.select().from(schema.users).where(eq(schema.users.banned, false));
}

export async function banUser(db: DbClient, telegramId: number) {
  await db.update(schema.users).set({ banned: true }).where(eq(schema.users.telegramId, String(telegramId)));
}

export async function unbanUser(db: DbClient, telegramId: number) {
  await db.update(schema.users).set({ banned: false }).where(eq(schema.users.telegramId, String(telegramId)));
}

// ============ SUBSCRIPTIONS ============

export async function getActiveSubscription(db: DbClient, telegramId: number) {
  const now = Date.now();
  return db.select()
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.telegramId, String(telegramId)),
        gte(schema.subscriptions.expiresAt, now)
      )
    )
    .get();
}

export async function getUserSubscription(db: DbClient, telegramId: number) {
  return db.select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.telegramId, String(telegramId)))
    .get();
}

export async function createSubscription(
  db: DbClient,
  telegramId: number,
  tariff: string,
  expiresAt: number,
  key: string
) {
  await db.insert(schema.subscriptions).values({
    telegramId: String(telegramId),
    tariff: tariff,
    expiresAt: expiresAt,
    key: key,
    reminderSent: false,
    updatedAt: Date.now(),
  });
}

export async function updateSubscription(
  db: DbClient,
  telegramId: number,
  tariff: string,
  expiresAt: number,
  key: string
) {
  await db.update(schema.subscriptions)
    .set({ 
      tariff: tariff,
      expiresAt: expiresAt,
      key: key,
      updatedAt: Date.now() 
    })
    .where(eq(schema.subscriptions.telegramId, String(telegramId)));
}

// ============ FREE KEYS ============

export async function getFreeKey(db: DbClient) {
  return db.select().from(schema.freeKeys).get();
}

export async function addFreeKey(db: DbClient, key: string) {
  await db.insert(schema.freeKeys).values({ key: key, createdAt: Date.now() });
}

export async function deleteFreeKey(db: DbClient, key: string) {
  await db.delete(schema.freeKeys).where(eq(schema.freeKeys.key, key));
}

// ============ PREMIUM KEYS ============

export async function getAvailablePremiumKey(db: DbClient) {
  return db.select()
    .from(schema.premiumKeys)
    .where(eq(schema.premiumKeys.isUsed, false))
    .get();
}

export async function addPremiumKey(db: DbClient, key: string) {
  await db.insert(schema.premiumKeys).values({
    key: key,
    createdAt: Date.now(),
    isUsed: false,
  });
}

export async function usePremiumKey(db: DbClient, key: string, telegramId: number) {
  await db.update(schema.premiumKeys)
    .set({
      isUsed: true,
      usedBy: String(telegramId),
      usedAt: Date.now(),
    })
    .where(eq(schema.premiumKeys.key, key));
}

// ============ REFERRALS ============

export async function addReferral(db: DbClient, userId: number, inviterId: number) {
  await db.insert(schema.referrals).values({
    userId: String(userId),
    inviterId: String(inviterId),
    createdAt: Date.now(),
  });

  const existing = await db.select()
    .from(schema.referralCounts)
    .where(eq(schema.referralCounts.userId, String(inviterId)))
    .get();

  if (existing) {
    await db.update(schema.referralCounts)
      .set({ count: existing.count + 1 })
      .where(eq(schema.referralCounts.userId, String(inviterId)));
  } else {
    await db.insert(schema.referralCounts).values({
      userId: String(inviterId),
      count: 1,
    });
  }
}

export async function getReferralCount(db: DbClient, telegramId: number) {
  const result = await db.select()
    .from(schema.referralCounts)
    .where(eq(schema.referralCounts.userId, String(telegramId)))
    .get();
  return result?.count || 0;
}

export async function getReferrals(db: DbClient, telegramId: number) {
  return db.select()
    .from(schema.referrals)
    .where(eq(schema.referrals.inviterId, String(telegramId)));
}

// ============ SUPPORT CHATS ============

export async function getSupportChat(db: DbClient, telegramId: number) {
  return db.select()
    .from(schema.supportChats)
    .where(eq(schema.supportChats.userId, String(telegramId)))
    .get();
}

export async function createOrUpdateSupportChat(
  db: DbClient,
  telegramId: number,
  messages: Array<{ from: string; text: string; time: number }>
) {
  const existing = await getSupportChat(db, telegramId);

  if (existing) {
    await db.update(schema.supportChats)
      .set({
        messages: JSON.stringify(messages),
        closed: false,
        updatedAt: Date.now(),
      })
      .where(eq(schema.supportChats.userId, String(telegramId)));
  } else {
    await db.insert(schema.supportChats).values({
      userId: String(telegramId),
      messages: JSON.stringify(messages),
      closed: false,
      updatedAt: Date.now(),
    });
  }
}

export async function closeSupportChat(db: DbClient, telegramId: number) {
  await db.update(schema.supportChats)
    .set({ closed: true, updatedAt: Date.now() })
    .where(eq(schema.supportChats.userId, String(telegramId)));
}

export async function getAllOpenSupportChats(db: DbClient) {
  return db.select()
    .from(schema.supportChats)
    .where(eq(schema.supportChats.closed, false));
}

// ============ SETTINGS ============

export async function getSetting(db: DbClient, key: string) {
  const result = await db.select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get();
  return result?.value;
}

export async function setSetting(db: DbClient, key: string, value: string) {
  const existing = await db.select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get();

  if (existing) {
    await db.update(schema.settings)
      .set({ value: value, updatedAt: Date.now() })
      .where(eq(schema.settings.key, key));
  } else {
    await db.insert(schema.settings).values({ key: key, value: value, updatedAt: Date.now() });
  }
}
