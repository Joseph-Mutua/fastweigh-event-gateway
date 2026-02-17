export function renderAdminConsoleHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fast-Weigh Event Gateway Admin</title>
    <style>
      :root {
        --bg: #0d1117;
        --panel: #161b22;
        --text: #e6edf3;
        --muted: #8b949e;
        --accent: #2ea043;
        --danger: #f85149;
        --border: #30363d;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: radial-gradient(circle at top left, #1f2937 0, var(--bg) 55%);
        color: var(--text);
      }
      .wrap {
        max-width: 1080px;
        margin: 0 auto;
        padding: 24px;
      }
      h1 { margin: 0 0 18px; font-size: 24px; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }
      .panel {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 10px;
        padding: 14px;
      }
      .label { color: var(--muted); font-size: 12px; margin-bottom: 4px; }
      .value { font-size: 22px; font-weight: 600; }
      button {
        margin-top: 12px;
        border: 0;
        border-radius: 8px;
        background: var(--accent);
        color: #fff;
        font-size: 14px;
        padding: 8px 12px;
        cursor: pointer;
      }
      button:hover { filter: brightness(1.1); }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th, td {
        border-bottom: 1px solid var(--border);
        text-align: left;
        padding: 8px;
      }
      th { color: var(--muted); font-weight: 600; }
      .danger { color: var(--danger); font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Fast-Weigh Event Gateway Admin Console</h1>
      <div id="root"></div>
    </div>
    <script type="module">
      import React from "https://esm.sh/react@18";
      import { createRoot } from "https://esm.sh/react-dom@18/client";

      function StatPanel({ label, value }) {
        return React.createElement("div", { className: "panel" }, [
          React.createElement("div", { key: "label", className: "label" }, label),
          React.createElement("div", { key: "value", className: "value" }, String(value))
        ]);
      }

      function TablePanel({ title, rows }) {
        return React.createElement("div", { className: "panel" }, [
          React.createElement("div", { key: "title", className: "label" }, title),
          React.createElement(
            "table",
            { key: "table" },
            React.createElement("tbody", null, rows.map((row) =>
              React.createElement("tr", { key: row.id }, [
                React.createElement("td", { key: "time" }, row.time),
                React.createElement("td", { key: "type" }, row.type),
                React.createElement("td", { key: "status", className: row.status === "failed" ? "danger" : "" }, row.status),
                React.createElement("td", { key: "detail" }, row.detail || "")
              ])
            ))
          )
        ]);
      }

      function App() {
        const [metrics, setMetrics] = React.useState(null);
        const [events, setEvents] = React.useState([]);
        const [failures, setFailures] = React.useState([]);
        const [health, setHealth] = React.useState(null);

        const refresh = React.useCallback(async () => {
          const [m, e, f, h] = await Promise.all([
            fetch("/admin/metrics").then((r) => r.json()),
            fetch("/admin/events?limit=10").then((r) => r.json()),
            fetch("/admin/failures?limit=10").then((r) => r.json()),
            fetch("/admin/health").then((r) => r.json())
          ]);
          setMetrics(m);
          setEvents(e.items || []);
          setFailures(f.items || []);
          setHealth(h);
        }, []);

        React.useEffect(() => {
          void refresh();
          const timer = setInterval(() => void refresh(), 5000);
          return () => clearInterval(timer);
        }, [refresh]);

        const replayDlq = async () => {
          await fetch("/admin/dlq/replay", { method: "POST" });
          await refresh();
        };

        if (!metrics) {
          return React.createElement("div", { className: "panel" }, "Loading...");
        }

        return React.createElement(React.Fragment, null, [
          React.createElement("div", { key: "stats", className: "grid" }, [
            React.createElement(StatPanel, { key: "waiting", label: "Queue Waiting", value: metrics.queue.waiting }),
            React.createElement(StatPanel, { key: "active", label: "Queue Active", value: metrics.queue.active }),
            React.createElement(StatPanel, { key: "failed", label: "Queue Failed", value: metrics.queue.failed }),
            React.createElement(StatPanel, { key: "dlq", label: "DLQ Waiting", value: metrics.dlq.waiting }),
            React.createElement(StatPanel, {
              key: "health",
              label: "Admin Health",
              value: health && health.ok ? "OK" : "DEGRADED"
            })
          ]),
          React.createElement(
            "div",
            { key: "actions", className: "panel" },
            React.createElement("button", { onClick: replayDlq }, "Replay DLQ")
          ),
          React.createElement("div", { key: "tables", className: "grid" }, [
            React.createElement(TablePanel, {
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
            React.createElement(TablePanel, {
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
