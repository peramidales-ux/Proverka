app.post("/tg/user", async (c) => {
  // ВРЕМЕННО УБИРАЕМ ПРОВЕРКУ
  // if (c.req.header("x-telegram-bot-api-secret-token") !== c.env.WEBHOOK_SECRET) {
  //   return c.text("Forbidden", 403);
  // }
  const db = getDb(c.env.DB);
  const handler = userBotWebhookHandler(c.env, db);
  return handler(c.req.raw);
});

app.post("/tg/admin", async (c) => {
  // ВРЕМЕННО УБИРАЕМ ПРОВЕРКУ
  // if (c.req.header("x-telegram-bot-api-secret-token") !== c.env.WEBHOOK_SECRET) {
  //   return c.text("Forbidden", 403);
  // }
  const db = getDb(c.env.DB);
  const handler = adminBotWebhookHandler(c.env, db);
  return handler(c.req.raw);
});
