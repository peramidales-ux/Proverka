import { Hono } from "hono";
import { getDb } from "./db/client";
import { userBotWebhookHandler } from "./bots/userBot";
import { adminBotWebhookHandler } from "./bots/adminBot";

export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  ADMIN_BOT_TOKEN: string;
  ADMIN_ID: string;
  WEBHOOK_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/healthz", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

app.post("/tg/user", async (c) => {
  if (c.req.header("x-telegram-bot-api-secret-token") !== c.env.WEBHOOK_SECRET) {
    return c.text("Forbidden", 403);
  }
  const db = getDb(c.env.DB);
  const handler = userBotWebhookHandler({
    BOT_TOKEN: c.env.BOT_TOKEN,
    ADMIN_ID: c.env.ADMIN_ID
  }, db);
  return handler(c.req.raw);
});

app.post("/tg/admin", async (c) => {
  if (c.req.header("x-telegram-bot-api-secret-token") !== c.env.WEBHOOK_SECRET) {
    return c.text("Forbidden", 403);
  }
  const db = getDb(c.env.DB);
  const handler = adminBotWebhookHandler({
    ADMIN_BOT_TOKEN: c.env.ADMIN_BOT_TOKEN,
    ADMIN_ID: c.env.ADMIN_ID
  }, db);
  return handler(c.req.raw);
});

export default app;
