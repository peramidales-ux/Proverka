import { Hono } from "hono";

export const routes = new Hono();

routes.get("/healthz", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

routes.get("/sub", (c) => {
  const key = c.req.query("key") ?? "";
  if (!key) return c.text("Bad request", 400);

  const encoded = Buffer.from(key).toString('base64');
  c.header("Content-Disposition", `attachment; filename="sub.txt"`);
  c.header("Content-Type", "text/plain");
  return c.text(encoded);
});

routes.get("/connect", (c) => {
  const app = c.req.query("app") ?? "";
  const key = c.req.query("key") ?? "";
  if (!key || !app) return c.text("Bad request", 400);

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>VPN Connection</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <h1>🔐 VPN Connection</h1>
    <p>Click the button below to connect:</p>
    <a href="${app}://connect?key=${encodeURIComponent(key)}" 
       style="display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
      Connect to VPN
    </a>
  </body>
  </html>
  `;

  return c.html(html);
});
