import { Hono } from "hono";

export const routes = new Hono();

routes.get("/healthz", (c) => {
  return c.json({ status: "ok" });
});

routes.get("/sub", (c) => {
  const key = c.req.query("key") ?? "";
  if (!key) return c.text("Bad request", 400);
  const encoded = Buffer.from(key).toString('base64');
  c.header("Content-Type", "text/plain");
  return c.text(encoded);
});

routes.get("/connect", (c) => {
  const app = c.req.query("app") ?? "";
  const key = c.req.query("key") ?? "";
  if (!key || !app) return c.text("Bad request", 400);
  
  const html = `<html><body><h1>VPN Connection</h1><a href="${app}://connect?key=${key}">Connect</a></body></html>`;
  return c.html(html);
});
