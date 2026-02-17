import express, { type Router } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { buildIpAllowlistMiddleware } from "./lib/ip-allowlist.js";
import { logger } from "./lib/logger.js";
import { createAdminRouter } from "./modules/admin/router.js";
import { adminAuthMiddleware } from "./modules/security/admin-auth.js";
import { createWebhookRouter } from "./modules/webhooks/router.js";

export function createApp(): express.Express {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(
    helmet({
      hsts: env.NODE_ENV === "production",
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://esm.sh"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:"]
        }
      }
    })
  );
  app.use(cors());
  app.use((request, _response, next) => {
    logger.info({ method: request.method, path: request.path, ip: request.ip }, "HTTP request");
    next();
  });
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 600
    })
  );

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "fast-weigh-event-gateway" });
  });

  const webhookRouter: Router = createWebhookRouter();
  app.use(env.WEBHOOK_ROUTE, buildIpAllowlistMiddleware(env.WEBHOOK_IP_ALLOWLIST), webhookRouter);
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/admin",
    buildIpAllowlistMiddleware(env.ADMIN_IP_ALLOWLIST),
    adminAuthMiddleware,
    createAdminRouter()
  );

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      void _next;
      logger.error({ err: error }, "Unhandled application error");
      response.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}
