import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env.js";
import { redis } from "../../lib/redis.js";

const latestReportKey = "reconciliation:latest-report";

export type ReconciliationEntityReport = {
  entity: "ticket" | "order";
  changedResources: number;
  missingResources: number;
  replayedResources: number;
};

export type ReconciliationReport = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  lookbackDays: number;
  status: "success" | "failure";
  entities: ReconciliationEntityReport[];
  errors: string[];
};

export async function persistReconciliationReport(report: ReconciliationReport): Promise<void> {
  await mkdir(env.RECONCILIATION_REPORT_PATH, { recursive: true });
  const filePath = path.join(env.RECONCILIATION_REPORT_PATH, `${report.runId}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2), "utf8");
  await redis.set(latestReportKey, JSON.stringify(report), "EX", 60 * 60 * 24 * 30);
}

export async function getLatestReconciliationReport(): Promise<ReconciliationReport | null> {
  const raw = await redis.get(latestReportKey);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as ReconciliationReport;
}

export async function listRecentReconciliationReports(limit: number): Promise<ReconciliationReport[]> {
  await mkdir(env.RECONCILIATION_REPORT_PATH, { recursive: true });
  const files = (await readdir(env.RECONCILIATION_REPORT_PATH))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, Math.max(0, limit));

  const reports: ReconciliationReport[] = [];
  for (const fileName of files) {
    const fullPath = path.join(env.RECONCILIATION_REPORT_PATH, fileName);
    const raw = await readFile(fullPath, "utf8");
    reports.push(JSON.parse(raw) as ReconciliationReport);
  }
  return reports;
}
