"use client";

import { useState } from "react";

interface TryItPanelProps {
  method?: string;
  path?: string;
  baseUrl?: string;
  requestBody?: string;
}

export default function TryItPanel({
  method = "GET",
  path = "/",
  baseUrl = "",
  requestBody = "{}",
}: TryItPanelProps) {
  const [body, setBody] = useState(requestBody);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `${baseUrl.replace(/\/$/, "")}${path}`;

  async function handleSend() {
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const opts: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (method !== "GET" && body.trim()) {
        try {
          JSON.parse(body);
          opts.body = body;
        } catch {
          setError("Invalid JSON in request body");
          setLoading(false);
          return;
        }
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      let parsed: string;
      try {
        parsed = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        parsed = text;
      }
      setResponse(`${res.status} ${res.statusText}\n\n${parsed}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-surface" style={wrapperStyle}>
      <div style={headerStyle}>
        <span className="theme-accent" style={titleStyle}>
          Try it
        </span>
        <code style={pathStyle}>
          {method} {url || path}
        </code>
      </div>
      {(method === "POST" || method === "PUT" || method === "PATCH") && (
        <div style={fieldStyle}>
          <label style={labelStyle}>Request body (JSON)</label>
          <textarea
            className="theme-surface"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={textareaStyle}
            spellCheck={false}
          />
        </div>
      )}
      <button
        type="button"
        className="theme-button theme-accent"
        onClick={handleSend}
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? "Sending…" : "Send request"}
      </button>
      {error && <p style={errorStyle}>{error}</p>}
      {response && (
        <pre className="theme-code" style={responseStyle}>
          <code>{response}</code>
        </pre>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  boxShadow: "var(--docs-shadow)",
  padding: "1rem 1.25rem",
  marginBlock: "0.5rem",
  maxWidth: "100%",
};

const headerStyle: React.CSSProperties = {
  marginBottom: "0.75rem",
};

const titleStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.25rem",
};

const pathStyle: React.CSSProperties = {
  fontFamily: "var(--docs-font-mono)",
  fontSize: "0.875rem",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "0.75rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  marginBottom: "0.25rem",
  color: "var(--docs-text-muted)",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "4px",
  padding: "0.5rem 0.75rem",
  fontSize: "0.8125rem",
  fontFamily: "var(--docs-font-mono)",
  resize: "vertical",
  minHeight: "120px",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid var(--docs-accent)",
  background: "var(--docs-accent-soft)",
  color: "var(--docs-accent)",
  boxShadow: "var(--docs-shadow)",
};

const errorStyle: React.CSSProperties = {
  margin: "0.75rem 0 0",
  fontSize: "0.875rem",
  color: "#ef4444",
};

const responseStyle: React.CSSProperties = {
  margin: "0.75rem 0 0",
  padding: "0.75rem",
  borderRadius: "4px",
  fontSize: "0.8125rem",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};
