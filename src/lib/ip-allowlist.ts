import ipaddr from "ipaddr.js";
import type { Request, RequestHandler } from "express";

type AllowRule =
  | { kind: "ip"; ip: ipaddr.IPv4 | ipaddr.IPv6 }
  | { kind: "cidr"; cidr: [ipaddr.IPv4 | ipaddr.IPv6, number] };

function toRule(value: string): AllowRule {
  if (value.includes("/")) {
    const cidr = ipaddr.parseCIDR(value);
    return { kind: "cidr", cidr };
  }
  return { kind: "ip", ip: ipaddr.parse(value) };
}

function normalizeIp(input: string): ipaddr.IPv4 | ipaddr.IPv6 {
  const parsed = ipaddr.parse(input);
  if (parsed.kind() === "ipv6") {
    const ipv6 = parsed as ipaddr.IPv6;
    if (ipv6.isIPv4MappedAddress()) {
      return ipv6.toIPv4Address();
    }
  }
  return parsed;
}

function matchesRule(candidate: ipaddr.IPv4 | ipaddr.IPv6, rule: AllowRule): boolean {
  if (rule.kind === "ip") {
    return candidate.toString() === rule.ip.toString();
  }
  return candidate.match(rule.cidr);
}

export function buildIpAllowlistMiddleware(list: string): RequestHandler {
  const values = list
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return (_request, _response, next) => {
      next();
    };
  }

  const rules = values.map(toRule);
  return (request, response, next) => {
    const rawIp = extractRequestIp(request);
    if (!rawIp) {
      response.status(403).json({ error: "Missing client IP for allowlist check." });
      return;
    }

    let candidate: ipaddr.IPv4 | ipaddr.IPv6;
    try {
      candidate = normalizeIp(rawIp);
    } catch {
      response.status(403).json({ error: "Invalid client IP address." });
      return;
    }

    const allowed = rules.some((rule) => matchesRule(candidate, rule));
    if (!allowed) {
      response.status(403).json({ error: "IP not allowlisted." });
      return;
    }
    next();
  };
}

function extractRequestIp(request: Request): string | undefined {
  if (request.ip) {
    return request.ip;
  }
  const forwardedFor = request.header("x-forwarded-for");
  if (!forwardedFor) {
    return undefined;
  }
  return forwardedFor.split(",")[0]?.trim();
}
