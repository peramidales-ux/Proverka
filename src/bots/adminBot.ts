import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { DbClient } from "../db/client";
import * as db from "../db/queries";

export function createAdminBot(env: { ADMIN_BOT_TOKEN: string; ADMIN_ID: string }, dbClient: DbClient) {
  const bot = new Bot(env.ADMIN_BOT_TOKEN);

  // Admin only middleware
  bot.use(async (ctx, next) => {
    if (String(ctx.from?.id) !== env.ADMIN_ID) {
      await ctx.reply("⛔ Доступ запрещен");
      return;
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("📊 Статистика", "admin_stats"),
        InlineKeyboard.text("👥 Пользователи", "admin_users")
      )
      .row(
        InlineKeyboard.text("🔑 Ключи", "admin_keys"),
        InlineKeyboard.text("📢 Рассылка", "admin_broadcast")
      )
      .row(
        InlineKeyboard.text("💬 Поддержка", "admin_support")
      );

    await ctx.reply(
      "🔐 Панель администратора\n\n" +
      "Выберите действие:",
      { reply_markup: kb }
    );
  });

  // Admin menu
  bot.callbackQuery("admin_menu", async (ctx) => {
    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("📊 Статистика", "admin_stats"),
        InlineKeyboard.text("👥 Пользователи", "admin_users")
      )
      .row(
        InlineKeyboard.text("🔑 Ключи", "admin_keys"),
        InlineKeyboard.text("📢 Рассылка", "admin_broadcast")
      )
      .row(
        InlineKeyboard.text("💬 Поддержка", "admin_support")
      );

    await ctx.editMessageText(
      "🔐 Панель администратора\n\n" +
      "Выберите действие:",
      { reply_markup: kb }
    );
    await ctx.answerCallbackQuery();
  });

  // Statistics
  bot.callbackQuery("admin_stats", async (ctx) => {
    const users = await db.getAllUsers(dbClient);
    const activeUsers = await db.getActiveUsers(dbClient);
    const freeKey = await db.getFreeKey(dbClient);
    const premiumKey = await db.getAvailablePremiumKey(dbClient);

    const stats = 
      "📊 Статистика:\n\n" +
      `👥 Всего пользователей: ${users.length}\n` +
      `✅ Активных: ${activeUsers.length}\n` +
      `🚫 Забаненных: ${users.length - activeUsers.length}\n` +
      `🎫 Свободных ключей: ${freeKey ? 1 : 0}\n` +
      `💎 Премиум ключей: ${premiumKey ? 1 : 0}\n`;

    await ctx.editMessageText(stats, { reply_markup: adminMenuKeyboard() });
    await ctx.answerCallbackQuery();
  });

  // Users list
  bot.callbackQuery("admin_users", async (ctx) => {
    const users = await db.getAllUsers(dbClient);
    const kb = new InlineKeyboard();

    users.slice(0, 10).forEach(user => {
      kb.row(InlineKeyboard.text(
        `${user.name}${user.banned ? ' 🚫' : ''}`,
        `admin_user_${user.telegramId}`
      ));
    });

    kb.row(InlineKeyboard.text("⬅️ Назад", "admin_menu"));
    await ctx.editMessageText(
      "👥 Список пользователей:\n\n" +
      `Всего: ${users.length}`,
      { reply_markup: kb }
    );
    await ctx.answerCallbackQuery();
  });

  // User detail
  bot.callbackQuery(/^admin_user_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const user = await db.getUser(dbClient, parseInt(userId));

    if (!user) {
      await ctx.answerCallbackQuery("Пользователь не найден");
      return;
    }

    const subscription = await db.getUserSubscription(dbClient, parseInt(userId));

    let text =
      `👤 Пользователь: ${user.name}\n` +
      `🆔 ID: ${user.telegramId}\n` +
      `📝 Username: @${user.username || 'не указан'}\n` +
      `💰 Баланс: ${user.balance}₽\n` +
      `📅 Создан: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}\n` +
      `🚫 Забанен: ${user.banned ? 'Да' : 'Нет'}\n\n`;

    if (subscription) {
      text += 
        "🔑 Подписка:\n" +
        `📱 Тариф: ${subscription.tariff}\n` +
        `📅 Истекает: ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}\n`;
    } else {
      text += "❌ Нет активной подписки\n";
    }

    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text(
          user.banned ? "✅ Разбанить" : "🚫 Забанить",
          user.banned ? `admin_unban_${userId}` : `admin_ban_${userId}`
        )
      )
      .row(
        InlineKeyboard.text("⬅️ Назад", "admin_users")
      );

    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  // Ban/Unban
  bot.callbackQuery(/^admin_ban_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await db.banUser(dbClient, parseInt(userId));
    await ctx.answerCallbackQuery("Пользователь забанен");
    await ctx.editMessageText("✅ Пользователь забанен", { reply_markup: adminMenuKeyboard() });
  });

  bot.callbackQuery(/^admin_unban_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await db.unbanUser(dbClient, parseInt(userId));
    await ctx.answerCallbackQuery("Пользователь разбанен");
    await ctx.editMessageText("✅ Пользователь разбанен", { reply_markup: adminMenuKeyboard() });
  });

  // Keys management
  bot.callbackQuery("admin_keys", async (ctx) => {
    const freeKey = await db.getFreeKey(dbClient);
    const premiumKey = await db.getAvailablePremiumKey(dbClient);

    const text = 
      "🔑 Управление ключами\n\n" +
      `🎫 Свободных ключей: ${freeKey ? 1 : 0}\n` +
      `💎 Премиум ключей: ${premiumKey ? 1 : 0}\n\n` +
      "Используйте команды:\n" +
      "/addfree <ключ> - добавить бесплатный ключ\n" +
      "/addpremium <ключ> - добавить премиум ключ";

    await ctx.editMessageText(text, { reply_markup: adminMenuKeyboard() });
    await ctx.answerCallbackQuery();
  });

  // Add free key
  bot.command("addfree", async (ctx) => {
    const key = ctx.message?.text?.split(' ')[1];
    if (!key) {
      await ctx.reply("⚠️ Используйте: /addfree <ключ>");
      return;
    }

    await db.addFreeKey(dbClient, key);
    await ctx.reply(`✅ Бесплатный ключ добавлен: ${key}`);
  });

  // Add premium key
  bot.command("addpremium", async (ctx) => {
    const key = ctx.message?.text?.split(' ')[1];
    if (!key) {
      await ctx.reply("⚠️ Используйте: /addpremium <ключ>");
      return;
    }

    await db.addPremiumKey(dbClient, key);
    await ctx.reply(`✅ Премиум ключ добавлен: ${key}`);
  });

  // Broadcast
  bot.callbackQuery("admin_broadcast", async (ctx) => {
    await ctx.editMessageText(
      "📢 Рассылка\n\n" +
      "Отправьте сообщение для рассылки всем пользователям.\n" +
      "Сообщение должно начинаться с команды /broadcast",
      { reply_markup: adminMenuKeyboard() }
    );
    await ctx.answerCallbackQuery();
  });

  bot.command("broadcast", async (ctx) => {
    const message = ctx.message?.text?.replace('/broadcast', '').trim();
    if (!message) {
      await ctx.reply("⚠️ Используйте: /broadcast <текст сообщения>");
      return;
    }

    const users = await db.getAllUsers(dbClient);
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (user.banned) continue;
      try {
        await bot.api.sendMessage(parseInt(user.telegramId), message);
        sent++;
      } catch (error) {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await ctx.reply(
      `✅ Рассылка завершена!\n` +
      `📨 Отправлено: ${sent}\n` +
      `❌ Ошибок: ${failed}`
    );
  });

  // Support
  bot.callbackQuery("admin_support", async (ctx) => {
    const chats = await db.getAllOpenSupportChats(dbClient);

    if (chats.length === 0) {
      await ctx.editMessageText(
        "💬 Поддержка\n\n" +
        "Нет открытых чатов",
        { reply_markup: adminMenuKeyboard() }
      );
    } else {
      const kb = new InlineKeyboard();
      chats.slice(0, 10).forEach((chat) => {
        kb.row(InlineKeyboard.text(
          `Чат ${chat.userId}`,
          `admin_support_chat_${chat.userId}`
        ));
      });
      kb.row(InlineKeyboard.text("⬅️ Назад", "admin_menu"));

      await ctx.editMessageText(
        "💬 Открытые чаты поддержки:\n\n" +
        chats.map((chat, i) => 
          `${i + 1}. Пользователь ${chat.userId}`
        ).join('\n'),
        { reply_markup: kb }
      );
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^admin_support_chat_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const chat = await db.getSupportChat(dbClient, parseInt(userId));

    if (!chat) {
      await ctx.answerCallbackQuery("Чат не найден");
      return;
    }

    const messages = JSON.parse(chat.messages);
    const lastMessages = messages.slice(-5);

    let text = `💬 Чат с пользователем ${userId}\n\n`;
    lastMessages.forEach((msg: any) => {
      const time = new Date(msg.time).toLocaleString('ru-RU');
      text += `[${time}] ${msg.from === 'user' ? '👤' : '🤖'}: ${msg.text}\n`;
    });

    const kb = new InlineKeyboard()
      .row(
        InlineKeyboard.text("✉️ Ответить", `admin_support_reply_${userId}`),
        InlineKeyboard.text("❌ Закрыть", `admin_support_close_${userId}`)
      )
      .row(
        InlineKeyboard.text("⬅️ Назад", "admin_support")
      );

    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^admin_support_reply_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.editMessageText(
      `✉️ Ответ пользователю ${userId}\n\n` +
      "Напишите ваш ответ. Сообщение должно начинаться с команды /reply",
      { reply_markup: adminMenuKeyboard() }
    );
    await ctx.answerCallbackQuery();
  });

  bot.command("reply", async (ctx) => {
    const parts = ctx.message?.text?.split(' ');
    if (!parts || parts.length < 3) {
      await ctx.reply("⚠️ Используйте: /reply <user_id> <текст ответа>");
      return;
    }

    const userId = parts[1];
    const message = parts.slice(2).join(' ');

    try {
      await bot.api.sendMessage(parseInt(userId), `🤖 Ответ поддержки:\n\n${message}`);

      const chat = await db.getSupportChat(dbClient, parseInt(userId));
      if (chat) {
        const messages = JSON.parse(chat.messages);
        messages.push({
          from: "admin",
          text: message,
          time: Date.now()
        });
        await db.createOrUpdateSupportChat(dbClient, parseInt(userId), messages);
      }

      await ctx.reply(`✅ Ответ отправлен пользователю ${userId}`);
    } catch (error) {
      await ctx.reply(`❌ Ошибка при отправке сообщения: ${error}`);
    }
  });

  bot.callbackQuery(/^admin_support_close_(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await db.closeSupportChat(dbClient, parseInt(userId));
    await ctx.answerCallbackQuery("Чат закрыт");
    await ctx.editMessageText("✅ Чат поддержки закрыт", { reply_markup: adminMenuKeyboard() });
  });

  return bot;
}

export function adminBotWebhookHandler(env: { ADMIN_BOT_TOKEN: string; ADMIN_ID: string }, db: DbClient) {
  const bot = createAdminBot(env, db);
  return webhookCallback(bot, "cloudflare-mod");
}
