import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { DbClient } from "../db/client";

export function createAdminBot(env: { ADMIN_BOT_TOKEN: string; ADMIN_ID: string }, dbClient: DbClient) {
  const bot = new Bot(env.ADMIN_BOT_TOKEN);

  bot.use(async (ctx, next) => {
    if (String(ctx.from?.id) !== env.ADMIN_ID) {
      await ctx.reply("⛔ Доступ запрещен");
      return;
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    const kb = new InlineKeyboard()
      .text("📊 Статистика", "stats")
      .text("👥 Пользователи", "users")
      .row()
      .text("🔑 Ключи", "keys");

    await ctx.reply("🔐 Панель администратора", { reply_markup: kb });
  });

  bot.callbackQuery("stats", async (ctx) => {
    await ctx.answerCallbackQuery("Статистика в разработке");
  });

  bot.callbackQuery("users", async (ctx) => {
    await ctx.answerCallbackQuery("Список пользователей в разработке");
  });

  bot.callbackQuery("keys", async (ctx) => {
    await ctx.answerCallbackQuery("Управление ключами в разработке");
  });

  return bot;
}

export function adminBotWebhookHandler(env: any, db: DbClient) {
  const bot = createAdminBot(env, db);
  return webhookCallback(bot, "cloudflare-mod");
}
