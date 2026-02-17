export function renderAdminConsoleHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fast-Weigh Event Gateway Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg-0: #f4f8fb;
        --bg-1: #deedf8;
        --ink-900: #0c1d2f;
        --ink-700: #2c445c;
        --ink-500: #5d7893;
        --card: rgba(255, 255, 255, 0.88);
        --card-strong: #ffffff;
        --line: rgba(15, 36, 58, 0.13);
        --ok: #0f8f4c;
        --warn: #cb8400;
        --bad: #c23a2a;
        --accent: #005ecb;
        --accent-strong: #0047a1;
        --shadow: 0 14px 36px rgba(12, 29, 47, 0.09);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Source Sans 3", sans-serif;
        color: var(--ink-900);
        background: #edf2f7;
      }

      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 30px 20px 44px;
      }

      .topbar {
        display: flex;
        gap: 14px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .brand {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .kicker {
        color: var(--ink-700);
        font-size: 13px;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(24px, 2.8vw, 36px);
        letter-spacing: -0.02em;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--line);
        padding: 9px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.74);
        font-size: 14px;
      }

      .status-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--warn);
      }

      .status-dot.ok {
        background: var(--ok);
      }

      .hero {
        border: 1px solid var(--line);
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(241, 248, 255, 0.92));
        box-shadow: var(--shadow);
        border-radius: 18px;
        padding: 18px;
        margin-bottom: 16px;
        display: grid;
        gap: 12px;
      }

      .hero p {
        margin: 0;
        color: var(--ink-700);
        font-size: 16px;
      }

      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      button {
        border: 0;
        border-radius: 10px;
        background: linear-gradient(160deg, var(--accent), var(--accent-strong));
        color: #fff;
        font-family: "Space Grotesk", sans-serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
        padding: 10px 14px;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 120ms ease, filter 160ms ease;
      }

      button:hover {
        transform: translateY(-1px);
        filter: brightness(1.05);
        box-shadow: 0 8px 22px rgba(0, 94, 203, 0.24);
      }

      button.secondary {
        background: #fff;
        color: var(--ink-900);
        border: 1px solid var(--line);
        box-shadow: none;
      }

      .meta-line {
        font-size: 13px;
        color: var(--ink-500);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .card {
        border: 1px solid var(--line);
        background: var(--card);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 8px 22px rgba(12, 29, 47, 0.06);
        backdrop-filter: blur(6px);
        opacity: 0;
        transform: translateY(8px);
        animation: fade-up 420ms ease forwards;
      }

      .card:nth-child(2) { animation-delay: 45ms; }
      .card:nth-child(3) { animation-delay: 90ms; }
      .card:nth-child(4) { animation-delay: 135ms; }
      .card:nth-child(5) { animation-delay: 180ms; }

      .label {
        color: var(--ink-500);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .value {
        font-family: "Space Grotesk", sans-serif;
        font-size: 30px;
        font-weight: 700;
        line-height: 1;
      }

      .value.bad { color: var(--bad); }
      .value.good { color: var(--ok); }

      .table-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .table-card {
        border: 1px solid var(--line);
        background: var(--card-strong);
        border-radius: 14px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .table-head {
        padding: 13px 14px;
        border-bottom: 1px solid var(--line);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .table-title {
        font-family: "Space Grotesk", sans-serif;
        font-weight: 600;
      }

      .count-pill {
        background: #eff4fb;
        border: 1px solid #dbe7f5;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        color: var(--ink-700);
      }

      .table-wrap {
        width: 100%;
        overflow: auto;
        max-height: 420px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      th, td {
        text-align: left;
        padding: 9px 10px;
        border-bottom: 1px solid #eef2f7;
        vertical-align: top;
      }

      th {
        position: sticky;
        top: 0;
        background: #f8fbff;
        color: var(--ink-700);
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      td {
        color: #19324a;
      }

      td.detail {
        max-width: 280px;
        color: var(--ink-700);
      }

      .event-type {
        font-family: "Space Grotesk", sans-serif;
        font-size: 12px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 3px 9px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .badge.ok {
        background: #e5f7ee;
        color: #0b7c41;
      }

      .badge.warn {
        background: #fff3db;
        color: #9a6200;
      }

      .badge.bad {
        background: #ffe6e3;
        color: #b13528;
      }

      .empty {
        padding: 22px 14px;
        color: var(--ink-500);
        font-size: 14px;
      }

      .error {
        border: 1px solid #ffd0c8;
        color: #982214;
        background: #fff1ed;
        border-radius: 10px;
        padding: 10px 12px;
      }

      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 900px) {
        .table-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 520px) {
        .wrap {
          padding: 16px 12px 24px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .value {
          font-size: 24px;
        }
      }

      @keyframes fade-up {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

    </style>
  </head>
  <body>
    <div class="wrap">
      <div id="root"></div>
    </div>
    <script type="module">
      import React from "https://esm.sh/react@18";
      import { createRoot } from "https://esm.sh/react-dom@18/client";

      function toBadgeClass(status) {
        if (status === "failed") {
          return "bad";
        }
        if (status === "duplicate") {
          return "warn";
        }
        return "ok";
      }

      function formatTime(value) {
        if (!value) {
          return "n/a";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return String(value);
        }
        return date.toLocaleString();
      }

      function StatCard({ label, value, tone }) {
        return React.createElement("div", { className: "card" }, [
          React.createElement("div", { key: "label", className: "label" }, label),
          React.createElement("div", { key: "value", className: "value " + (tone || "") }, String(value))
        ]);
      }

      function EventTable({ title, rows }) {
        return React.createElement("div", { className: "table-card" }, [
          React.createElement("div", { key: "head", className: "table-head" }, [
            React.createElement("div", { key: "title", className: "table-title" }, title),
            React.createElement("div", { key: "count", className: "count-pill" }, rows.length + " rows")
          ]),
          rows.length === 0
            ? React.createElement("div", { key: "empty", className: "empty" }, "No data yet.")
            : React.createElement(
                "div",
                { key: "wrap", className: "table-wrap" },
                React.createElement("table", null, [
                  React.createElement("thead", { key: "thead" }, React.createElement("tr", null, [
                    React.createElement("th", { key: "time" }, "Time"),
                    React.createElement("th", { key: "type" }, "Type"),
                    React.createElement("th", { key: "status" }, "Status"),
                    React.createElement("th", { key: "detail" }, "Detail")
                  ])),
                  React.createElement("tbody", { key: "tbody" }, rows.map((row) =>
                    React.createElement("tr", { key: row.id }, [
                      React.createElement("td", { key: "time" }, formatTime(row.time)),
                      React.createElement("td", { key: "type", className: "event-type" }, row.type),
                      React.createElement(
                        "td",
                        { key: "status" },
                        React.createElement("span", { className: "badge " + toBadgeClass(row.status) }, row.status)
                      ),
                      React.createElement("td", { key: "detail", className: "detail" }, row.detail || "-")
                    ])
                  ))
                ])
              )
        ]);
      }

      function App() {
        const [metrics, setMetrics] = React.useState(null);
        const [events, setEvents] = React.useState([]);
        const [failures, setFailures] = React.useState([]);
        const [health, setHealth] = React.useState(null);
        const [error, setError] = React.useState("");
        const [lastUpdated, setLastUpdated] = React.useState("");
        const [replaying, setReplaying] = React.useState(false);

        const refresh = React.useCallback(async () => {
          try {
            setError("");
            const [m, e, f, h] = await Promise.all([
              fetch("/admin/metrics").then((r) => r.json()),
              fetch("/admin/events?limit=12").then((r) => r.json()),
              fetch("/admin/failures?limit=12").then((r) => r.json()),
              fetch("/admin/health").then((r) => r.json())
            ]);
            setMetrics(m);
            setEvents(e.items || []);
            setFailures(f.items || []);
            setHealth(h);
            setLastUpdated(new Date().toISOString());
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to refresh dashboard data.");
          }
        }, []);

        React.useEffect(() => {
          void refresh();
          const timer = setInterval(() => void refresh(), 5000);
          return () => clearInterval(timer);
        }, [refresh]);

        const replayDlq = async () => {
          setReplaying(true);
          try {
            await fetch("/admin/dlq/replay", { method: "POST" });
            await refresh();
          } finally {
            setReplaying(false);
          }
        };

        if (!metrics) {
          return React.createElement("div", { className: "hero" }, [
            React.createElement("div", { key: "k", className: "kicker" }, "Fast-Weigh Event Gateway"),
            React.createElement("h1", { key: "h" }, "Loading Admin Console...")
          ]);
        }

        const healthOk = Boolean(health && health.ok);

        return React.createElement(React.Fragment, null, [
          React.createElement("div", { key: "topbar", className: "topbar" }, [
            React.createElement("div", { key: "brand", className: "brand" }, [
              React.createElement("div", { key: "k", className: "kicker" }, "Fast-Weigh Event Gateway"),
              React.createElement("h1", { key: "h" }, "Operations Console")
            ]),
            React.createElement("div", { key: "chip", className: "status-chip" }, [
              React.createElement("span", {
                key: "dot",
                className: "status-dot " + (healthOk ? "ok" : "")
              }),
              React.createElement("span", { key: "txt" }, healthOk ? "System healthy" : "System degraded")
            ])
          ]),
          React.createElement("section", { key: "hero", className: "hero" }, [
            React.createElement(
              "p",
              { key: "copy" },
              "Monitor queue health, inspect failures, and replay blocked deliveries from one control plane."
            ),
            error
              ? React.createElement("div", { key: "error", className: "error" }, error)
              : null,
            React.createElement("div", { key: "actions", className: "actions" }, [
              React.createElement(
                "button",
                { key: "replay", onClick: replayDlq, disabled: replaying },
                replaying ? "Replaying..." : "Replay DLQ"
              ),
              React.createElement(
                "button",
                { key: "refresh", className: "secondary", onClick: () => void refresh() },
                "Refresh now"
              )
            ]),
            React.createElement(
              "div",
              { key: "meta", className: "meta-line" },
              "Last update: " + (lastUpdated ? formatTime(lastUpdated) : "pending")
            )
          ]),
          React.createElement("section", { key: "stats", className: "grid" }, [
            React.createElement(StatCard, {
              key: "waiting",
              label: "Queue Waiting",
              value: metrics.queue.waiting
            }),
            React.createElement(StatCard, {
              key: "active",
              label: "Queue Active",
              value: metrics.queue.active
            }),
            React.createElement(StatCard, {
              key: "failed",
              label: "Queue Failed",
              value: metrics.queue.failed,
              tone: metrics.queue.failed > 0 ? "bad" : ""
            }),
            React.createElement(StatCard, {
              key: "dlq",
              label: "DLQ Waiting",
              value: metrics.dlq.waiting,
              tone: metrics.dlq.waiting > 0 ? "bad" : ""
            }),
            React.createElement(StatCard, {
              key: "health",
              label: "Admin Health",
              value: healthOk ? "OK" : "DEGRADED",
              tone: healthOk ? "good" : "bad"
            })
          ]),
          React.createElement("section", { key: "tables", className: "table-grid" }, [
            React.createElement(EventTable, {
              key: "events",
              title: "Recent Events",
              rows: events.map((item) => ({
                id: item.eventId + item.timestamp,
                time: item.timestamp,
                type: item.eventType,
                status: item.status,
                detail: item.detail
              }))
            }),
            React.createElement(EventTable, {
              key: "failures",
              title: "Recent Failures",
              rows: failures.map((item) => ({
                id: item.eventId + item.timestamp,
                time: item.timestamp,
                type: item.eventType,
                status: item.status,
                detail: item.detail
              }))
            })
          ])
        ]);
      }

      createRoot(document.getElementById("root")).render(React.createElement(App));
    </script>
  </body>
</html>`;
}
