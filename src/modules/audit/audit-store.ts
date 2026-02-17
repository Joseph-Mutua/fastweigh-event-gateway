import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { v4 as uuidv4 } from "uuid";

const auditDirectory = path.resolve("./data/audit");

export async function writeRawAudit(rawBody: string, headers: Record<string, string>): Promise<string> {
  await mkdir(auditDirectory, { recursive: true });
  const auditId = uuidv4();
  const filePath = path.join(auditDirectory, `${auditId}.json`);
  const body = {
    auditId,
    receivedAt: new Date().toISOString(),
    headers,
    rawBody
  };
  await writeFile(filePath, JSON.stringify(body, null, 2), "utf8");
  return auditId;
}
