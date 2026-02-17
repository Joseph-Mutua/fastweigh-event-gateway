import { describe, expect, it } from "vitest";

import { normalizeEvent } from "./normalize-event.js";

describe("normalizeEvent", () => {
  it("normalizes data payload shape", () => {
    const normalized = normalizeEvent({
      id: "evt_1",
      type: "ticket.updated",
      createdAt: "2026-01-01T00:00:00.000Z",
      tenantId: "tenant_1",
      data: { id: "ticket_1", status: "COMPLETED" }
    });

    expect(normalized.eventId).toBe("evt_1");
    expect(normalized.resourceId).toBe("ticket_1");
    expect(normalized.payload.status).toBe("COMPLETED");
    expect(normalized.signatureVerified).toBe(true);
  });
});
