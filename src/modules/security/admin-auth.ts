import type { RequestHandler } from "express";

import { env } from "../../config/env.js";

export const adminAuthMiddleware: RequestHandler = (request, response, next) => {
  if (!env.ADMIN_API_KEY) {
    next();
    return;
  }

  const supplied = request.header("x-admin-api-key");
  if (supplied !== env.ADMIN_API_KEY) {
    response.status(401).json({ error: "Unauthorized admin request." });
    return;
  }

  next();
};
