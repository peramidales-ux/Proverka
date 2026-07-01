import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { DbClient } from "../db/client";
import * as db from "../db/queries";

const TARIFFS = {
  "1month": { price: 500, days: 30, name: "1 месяц" },
  "3months": { price: 1200, days: 90, name: "3 месяца" },
  "6months": { price: 2000, days: 180, name: "6 месяцев" },
  "12months": { price: 3500, days: 365, name: "12 месяцев" },
};

export function createUserBot(env: { BOT_TOKEN: string; ADMIN_ID: string }, dbClient: DbClient) {
  const bot = new Bot(env.BOT_TOKEN);

  // Middleware
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();

    const user = await db.getOrCreateUser(
      dbClient,
      ctx.from.id,
      ctx.from.first_name,
      ctx.from.username
    );

    ctx.user = user;
    await next();
  });

  // Commands
  bot.command("start", async (ctx) => {
    // Referral
    if (ctx.match) {
      const inviterId = parseInt(ctx.match);
      if (!isNaN(inviterId) && inviterId !== ctx.from?.id) {
        await db.addReferral(dbClient, ctx.from!.id, inviterId);
        await ctx.reply("🎉 Вы успешно зарегистрировались по реферальной ссылке!");
      }
    }

    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("💰 Купить", "buy"),
        InlineKeyboard.text("👤 Профиль", "profile")
      )
      .row(
        InlineKeyboard.text("👥 Рефералы", "referral"),
        InlineKeyboard.text("🎁 Бесплатный ключ", "free_key")
      )
      .row(
        InlineKeyboard.text("💬 Поддержка", "support")
      );

    await ctx.reply(
      "👋 Добро пожаловать в VPN-бот!\n\n" +
      "Выберите действие:",
      { reply_markup: kb }
    );
  });

  // Callbacks
  bot.callbackQuery("buy", async (ctx) => {
    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("📱 1 месяц - 500₽", "tariff_1month"),
        InlineKeyboard.text("📱 3 месяца - 1200₽", "tariff_3months")
      )
      .row(
        InlineKeyboard.text("📱 6 месяцев - 2000₽", "tariff_6months"),
        InlineKeyboard.text("📱 12 месяцев - 3500₽", "tariff_12months")
      )
      .row(
        InlineKeyboard.text("⬅️ Назад", "start")
      );

    await ctx.editMessageText(
      "💰 Выберите тариф:\n\n" +
      "🔹 1 месяц — 500₽\n" +
      "🔹 3 месяца — 1200₽ (скидка 20%)\n" +
      "🔹 6 месяцев — 2000₽ (скидка 33%)\n" +
      "🔹 12 месяцев — 3500₽ (скидка 42%)",
      { reply_markup: kb }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^tariff_(.+)$/, async (ctx) => {
    const tariffId = ctx.match[1];
    const tariff = TARIFFS[tariffId as keyof typeof TARIFFS];

    if (!tariff) {
      await ctx.answerCallbackQuery("Тариф не найден");
      return;
    }

    const kb = new InlineKeyboard()
      .text(`💳 Оплатить ${tariff.price}₽`, `pay_${tariffId}`)
      .row()
      .text("⬅️ Назад", "buy");

    await ctx.editMessageText(
      `📱 Тариф: ${tariff.name}\n` +
      `💰 Цена: ${tariff.price}₽\n` +
      `📅 Срок: ${tariff.days} дней\n\n` +
      `Для оплаты нажмите кнопку ниже:`,
      { reply_markup: kb }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^pay_(.+)$/, async (ctx) => {
    const tariffId = ctx.match[1];
    const tariff = TARIFFS[tariffId as keyof typeof TARIFFS];

    // Здесь должна быть интеграция с платежной системой
    // Пока просто выдаем ключ
    const key = await db.getAvailablePremiumKey(dbClient);

    if (key) {
      await db.usePremiumKey(dbClient, key.key, ctx.from!.id);
      const expiresAt = Date.now() + tariff.days * 24 * 60 * 60 * 1000;
      await db.createSubscription(dbClient, ctx.from!.id, tariffId, expiresAt, key.key);

      await ctx.editMessageText(
        "✅ Оплата успешна!\n\n" +
        `🔑 Ваш ключ: \`${key.key}\`\n` +
        `📅 Действует: ${tariff.days} дней\n\n` +
        "Скопируйте ключ и используйте в приложении.",
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.editMessageText(
        "❌ К сожалению, все ключи закончились.\n" +
        "Пожалуйста, обратитесь в поддержку."
      );
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("free_key", async (ctx) => {
    const key = await db.getFreeKey(dbClient);

    if (key) {
      await db.deleteFreeKey(dbClient, key.key);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await db.createSubscription(dbClient, ctx.from!.id, "free", expiresAt, key.key);

      await ctx.editMessageText(
        "🎁 Вы получили бесплатный ключ!\n\n" +
        `🔑 Ваш ключ: \`${key.key}\`\n` +
        "📅 Действует 30 дней",
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.editMessageText(
        "😔 Бесплатные ключи закончились.\n" +
        "Попробуйте позже или приобретите подписку."
      );
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("profile", async (ctx) => {
    const user = await db.getUser(dbClient, ctx.from!.id);
    const subscription = await db.getActiveSubscription(dbClient, ctx.from!.id);
    const referralCount = await db.getReferralCount(dbClient, ctx.from!.id);

    let text = 
      "👤 Ваш профиль:\n\n" +
      `🆔 ID: ${user.telegramId}\n` +
      `👤 Имя: ${user.name}\n` +
      `💰 Баланс: ${user.balance}₽\n` +
      `👥 Приглашено: ${referralCount}\n\n`;

    if (subscription) {
      const daysLeft = Math.ceil((subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
      text += `✅ Подписка активна\n⏳ Осталось: ${daysLeft} дней`;
    } else {
      text += "❌ Нет активной подписки";
    }

    const kb = new InlineKeyboard().text("⬅️ Назад", "start");
    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("referral", async (ctx) => {
    const userId = ctx.from!.id;
    const count = await db.getReferralCount(dbClient, userId);
    const referralLink = `https://t.me/${bot.botInfo.username}?start=${userId}`;

    const text = 
      "👥 Реферальная система\n\n" +
      `Ваша ссылка:\n${referralLink}\n\n` +
      `👥 Приглашено: ${count} пользователей\n\n` +
      "💰 За каждого приглашенного вы получаете 50₽ на баланс";

    const kb = new InlineKeyboard().text("⬅️ Назад", "start");
    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("support", async (ctx) => {
    const text = 
      "💬 Поддержка\n\n" +
      "Напишите ваше сообщение, и мы ответим вам.\n" +
      "Вы можете отправить текстовое сообщение или файл.";

    const kb = new InlineKeyboard().text("⬅️ Назад", "start");
    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("start", async (ctx) => {
    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("💰 Купить", "buy"),
        InlineKeyboard.text("👤 Профиль", "profile")
      )
      .row(
        InlineKeyboard.text("👥 Рефералы", "referral"),
        InlineKeyboard.text("🎁 Бесплатный ключ", "free_key")
      )
      .row(
        InlineKeyboard.text("💬 Поддержка", "support")
      );

    await ctx.editMessageText(
      "👋 Главное меню\n\n" +
      "Выберите действие:",
      { reply_markup: kb }
    );
    await ctx.answerCallbackQuery();
  });

  // Handle messages (support)
  bot.on(":text", async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    
    const supportChat = await db.getSupportChat(dbClient, ctx.from!.id);
    if (supportChat && !supportChat.closed) {
      const messages = JSON.parse(supportChat.messages);
      messages.push({
        from: "user",
        text: ctx.message.text,
        time: Date.now()
      });
      await db.createOrUpdateSupportChat(dbClient, ctx.from!.id, messages);

      await ctx.api.sendMessage(
        env.ADMIN_ID,
        `📩 Новое сообщение от пользователя ${ctx.from!.id}:\n\n${ctx.message.text}`
      );

      await ctx.reply("✅ Сообщение отправлено в поддержку.");
    }
  });

  return bot;
}

export function userBotWebhookHandler(env: { BOT_TOKEN: string; ADMIN_ID: string }, db: DbClient) {
  const bot = createUserBot(env, db);
  return webhookCallback(bot, "cloudflare-mod");
    }
