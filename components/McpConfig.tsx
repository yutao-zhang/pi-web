"use client";

import { useState, useEffect, useCallback } from "react";

interface McpServerConfig {
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  lifecycle?: string;
  debug?: boolean;
  directTools?: string[];
  disabled?: boolean;
  [key: string]: unknown;
}

interface McpServerInfo {
  name: string;
  config: McpServerConfig;
  enabled: boolean;
  toolCount: number;
}

function Toggle({
  enabled,
  loading,
  onToggle,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={
        enabled
          ? "Server enabled — click to disable"
          : "Server disabled — click to enable"
      }
      style={{
        flexShrink: 0,
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        padding: 0,
        cursor: loading ? "wait" : "pointer",
        background: enabled ? "var(--accent)" : "var(--border)",
        position: "relative",
        transition: "background 0.18s",
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: enabled ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--bg)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
          transition: "left 0.18s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}

function ServerDetail({
  server,
  onToggle,
  toggling,
}: {
  server: McpServerInfo;
  onToggle: () => void;
  toggling: boolean;
}) {
  const config = server.config;
  
  // Determine server type
  const isUrl = !!config.url;
  const isCommand = !!config.command;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header with toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            padding: "1px 5px",
            borderRadius: 3,
            background: server.enabled
              ? "rgba(34,197,94,0.12)"
              : "rgba(120,120,120,0.12)",
            color: server.enabled ? "#16a34a" : "var(--text-dim)",
          }}
        >
          {server.enabled ? "enabled" : "disabled"}
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "1px 5px",
            borderRadius: 3,
            background: isUrl
              ? "rgba(59,130,246,0.12)"
              : "rgba(168,85,247,0.12)",
            color: isUrl ? "#3b82f6" : "#a855f7",
          }}
        >
          {isUrl ? "SSE" : isCommand ? "stdio" : "unknown"}
        </span>
        <div style={{ flex: 1 }} />
        <Toggle enabled={server.enabled} loading={toggling} onToggle={onToggle} />
      </div>

      {/* Server name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          Server Name
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--text)",
          }}
        >
          {server.name}
        </span>
      </div>

      {/* Connection info */}
      {config.url && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            Endpoint URL
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text)",
              wordBreak: "break-all",
            }}
          >
            {config.url}
          </span>
        </div>
      )}

      {config.command && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            Command
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            {config.command} {config.args?.join(" ") ?? ""}
          </span>
        </div>
      )}

      {/* Tools */}
      {config.directTools && config.directTools.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            Direct Tools ({config.directTools.length})
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {config.directTools.map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          Options
        </span>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          {config.lifecycle && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--text-dim)" }}>Lifecycle:</span>
              <span style={{ color: "var(--text)" }}>{config.lifecycle}</span>
            </div>
          )}
          {config.debug !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--text-dim)" }}>Debug:</span>
              <span style={{ color: "var(--text)" }}>{config.debug ? "on" : "off"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Environment variables */}
      {config.env && Object.keys(config.env).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            Environment Variables
          </span>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: 10,
              borderRadius: 6,
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              color: "var(--text-dim)",
            }}
          >
            {Object.entries(config.env).map(([key, value]) => (
              <div key={key}>
                {key}={value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function McpConfig({
  cwd,
  onClose,
}: {
  cwd: string;
  onClose: () => void;
}) {
  const [servers, setServers] = useState<McpServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [configExists, setConfigExists] = useState(true);

  const loadServers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/mcp?cwd=${encodeURIComponent(cwd)}`)
      .then((r) => r.json())
      .then((d: { servers?: McpServerInfo[]; error?: string; hasConfig?: boolean }) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setConfigExists(d.hasConfig !== false);
        const list = d.servers ?? [];
        setServers(list);
        if (list.length > 0 && !selected) setSelected(list[0].name);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [cwd, selected]);

  useEffect(() => {
    loadServers();
  }, [cwd]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async (server: McpServerInfo) => {
    const nextEnabled = !server.enabled;
    setToggling((s) => new Set(s).add(server.name));
    try {
      const res = await fetch("/api/mcp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: server.name,
          enabled: nextEnabled,
          cwd,
        }),
      });
      const d = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || d.error) {
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }
      setServers((prev) =>
        prev.map((s) =>
          s.name === server.name ? { ...s, enabled: nextEnabled } : s
        )
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setToggling((s) => {
        const n = new Set(s);
        n.delete(server.name);
        return n;
      });
    }
  }, [cwd]);

  const selectedServer = servers.find((s) => s.name === selected) ?? null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 860,
          height: "78vh",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              MCP Servers
            </span>
            <code
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cwd.replace(/^\/(?:Users|home)\/[^/]+/, "~")}
            </code>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: server list */}
          <div
            style={{
              width: 210,
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              background: "var(--bg-panel)",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              {loading ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--text-muted)" }}>
                  Loading…
                </div>
              ) : error ? (
                <div style={{ padding: "10px 8px", fontSize: 11, color: "#f87171" }}>
                  {error}
                </div>
              ) : servers.length === 0 ? (
                <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--text-dim)" }}>
                  {configExists ? "No MCP servers configured" : "No .mcp.json found"}
                </div>
              ) : (
                servers.map((server) => {
                  const isSelected = selected === server.name;
                  return (
                    <div
                      key={server.name}
                      onClick={() => setSelected(server.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "8px 8px",
                        borderRadius: 5,
                        cursor: "pointer",
                        background: isSelected ? "var(--bg-selected)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "none";
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: server.enabled ? "var(--accent)" : "var(--border)",
                          boxShadow: server.enabled ? "0 0 4px var(--accent)" : "none",
                          transition: "background 0.15s, box-shadow 0.15s",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 600 : 400,
                          color: server.enabled ? "var(--text)" : "var(--text-dim)",
                          fontFamily: "var(--font-mono)",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {server.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {loading ? null : selectedServer ? (
              <ServerDetail
                key={selectedServer.name}
                server={selectedServer}
                onToggle={() => toggle(selectedServer)}
                toggling={toggling.has(selectedServer.name)}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-dim)",
                  fontSize: 13,
                }}
              >
                Select an MCP server
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 18px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
            Configure MCP servers in <code style={{ fontFamily: "var(--font-mono)" }}>.mcp.json</code>
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
