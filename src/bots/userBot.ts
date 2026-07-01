import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { DbClient } from "../db/client";

export function createUserBot(env: { BOT_TOKEN: string; ADMIN_ID: string }, dbClient: DbClient) {
  const bot = new Bot(env.BOT_TOKEN);

  bot.command("start", async (ctx) => {
    const kb = new InlineKeyboard()
      .text("💰 Купить", "buy")
      .text("👤 Профиль", "profile")
      .row()
      .text("🎁 Бесплатный ключ", "free");

    await ctx.reply("👋 Добро пожаловать в VPN-бот!", { reply_markup: kb });
  });

  bot.callbackQuery("buy", async (ctx) => {
    await ctx.answerCallbackQuery("Функция в разработке");
  });

  bot.callbackQuery("profile", async (ctx) => {
    await ctx.answerCallbackQuery("Функция в разработке");
  });

  bot.callbackQuery("free", async (ctx) => {
    await ctx.answerCallbackQuery("Функция в разработке");
  });

  return bot;
}

export function userBotWebhookHandler(env: any, db: DbClient) {
  const bot = createUserBot(env, db);
  return webhookCallback(bot, "cloudflare-mod");
}
