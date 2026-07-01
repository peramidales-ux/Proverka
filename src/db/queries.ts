import { and, eq, gte, lt, desc } from "drizzle-orm";
import type { DbClient } from "./client";
import * as schema from "./schema";

// Users
export async function getOrCreateUser(db: DbClient, telegramId: number, name?: string, username?: string) { ... }
export async function getUser(db: DbClient, telegramId: number) { ... }
export async function getAllUsers(db: DbClient) { ... }
export async function banUser(db: DbClient, telegramId: number) { ... }
export async function unbanUser(db: DbClient, telegramId: number) { ... }

// Subscriptions
export async function getActiveSubscription(db: DbClient, telegramId: number) { ... }
export async function getUserSubscription(db: DbClient, telegramId: number) { ... }
export async function createSubscription(db: DbClient, telegramId: number, tariff: string, expiresAt: number, key: string) { ... }
export async function updateSubscription(db: DbClient, telegramId: number, data: any) { ... }

// Keys
export async function getFreeKey(db: DbClient) { ... }
export async function addFreeKey(db: DbClient, key: string) { ... }
export async function deleteFreeKey(db: DbClient, key: string) { ... }
export async function getAvailablePremiumKey(db: DbClient) { ... }
export async function addPremiumKey(db: DbClient, key: string) { ... }
export async function usePremiumKey(db: DbClient, key: string, telegramId: number) { ... }

// Referrals
export async function addReferral(db: DbClient, userId: number, inviterId: number) { ... }
export async function getReferralCount(db: DbClient, telegramId: number) { ... }
export async function getReferrals(db: DbClient, telegramId: number) { ... }

// Support
export async function getSupportChat(db: DbClient, telegramId: number) { ... }
export async function createOrUpdateSupportChat(db: DbClient, telegramId: number, messages: any[]) { ... }
export async function closeSupportChat(db: DbClient, telegramId: number) { ... }

// Settings
export async function getSetting(db: DbClient, key: string) { ... }
export async function setSetting(db: DbClient, key: string, value: string) { ... }
