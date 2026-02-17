import { Webhook } from "svix";

import { env } from "../../config/env.js";

type SvixHeaders = {
  "svix-id": string;
  "svix-signature": string;
  "svix-timestamp": string;
};

export function verifySvixSignature(rawBody: string, headers: SvixHeaders): unknown {
  const secrets = [env.FAST_WEIGH_WEBHOOK_SECRET, env.FAST_WEIGH_WEBHOOK_SECRET_PREVIOUS].filter(
    (value): value is string => Boolean(value)
  );

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return new Webhook(secret).verify(rawBody, headers);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
