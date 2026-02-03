"use client";

interface ResponseItem {
  code: string;
  description: string;
}

interface EndpointCardProps {
  method?: string;
  path?: string;
  summary?: string;
  description?: string;
  parameters?: { name: string; in: string; required?: boolean; description?: string }[];
  requestBody?: string;
  responses?: ResponseItem[] | Record<string, string>;
}

const methodColors: Record<string, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#8b5cf6",
  DELETE: "#ef4444",
};

export default function EndpointCard({
  method = "GET",
  path = "/",
  summary,
  description,
  parameters = [],
  requestBody,
  responses = {},
}: EndpointCardProps) {
  const methodColor = methodColors[method] ?? "var(--docs-accent)";
  const responseEntries = Array.isArray(responses)
    ? responses.map((r) => [r.code, r.description] as const)
    : Object.entries(responses);

  return (
    <div className="theme-surface" style={cardStyle}>
      <div style={headerStyle}>
        <span style={{ ...methodBadgeStyle, background: methodColor }}>
          {method}
        </span>
        <code style={pathStyle}>{path}</code>
      </div>
      {summary && <p style={summaryStyle}>{summary}</p>}
      {description && <p style={descStyle}>{description}</p>}
      {parameters.length > 0 && (
        <section style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Parameters</h4>
          <ul style={listStyle}>
            {parameters.map((p) => (
              <li key={p.name} style={listItemStyle}>
                <code style={paramNameStyle}>{p.name}</code>
                <span className="theme-muted" style={paramMetaStyle}>
                  {p.in}
                  {p.required ? ", required" : ""}
                </span>
                {p.description && <span> — {p.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {requestBody && (
        <section style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Request body</h4>
          <pre className="theme-code" style={preStyle}>
            {requestBody}
          </pre>
        </section>
      )}
      {responseEntries.length > 0 && (
        <section style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Responses</h4>
          <ul style={listStyle}>
            {responseEntries.map(([code, desc]) => (
              <li key={code} style={listItemStyle}>
                <strong>{code}</strong> — {desc}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  boxShadow: "var(--docs-shadow)",
  padding: "1rem 1.25rem",
  marginBlock: "0.5rem",
  maxWidth: "100%",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.5rem",
};

const methodBadgeStyle: React.CSSProperties = {
  padding: "0.2rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#fff",
};

const pathStyle: React.CSSProperties = {
  fontFamily: "var(--docs-font-mono)",
  fontSize: "0.9375rem",
  color: "var(--docs-accent)",
};

const summaryStyle: React.CSSProperties = {
  margin: "0 0 0.5rem",
  fontSize: "0.9375rem",
  fontWeight: 600,
};

const descStyle: React.CSSProperties = {
  margin: "0 0 0.75rem",
  fontSize: "0.875rem",
  color: "var(--docs-text-muted)",
  lineHeight: 1.5,
};

const sectionStyle: React.CSSProperties = {
  marginTop: "0.75rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid var(--docs-border)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 0.375rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--docs-text-muted)",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "1.25rem",
  fontSize: "0.875rem",
};

const listItemStyle: React.CSSProperties = {
  marginBottom: "0.25rem",
};

const paramNameStyle: React.CSSProperties = {
  fontFamily: "var(--docs-font-mono)",
  fontSize: "0.8125rem",
};

const paramMetaStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  marginLeft: "0.25rem",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: "0.5rem 0.75rem",
  borderRadius: "4px",
  fontSize: "0.8125rem",
  overflow: "auto",
};
