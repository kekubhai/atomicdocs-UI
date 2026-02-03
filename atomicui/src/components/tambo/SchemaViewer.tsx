"use client";

interface SchemaViewerProps {
  name?: string;
  schema: string | Record<string, unknown>;
  example?: string;
}

export default function SchemaViewer({
  name,
  schema,
  example,
}: SchemaViewerProps) {
  const schemaStr =
    typeof schema === "string" ? schema : JSON.stringify(schema, null, 2);

  return (
    <div className="theme-surface" style={wrapperStyle}>
      {name && (
        <div style={headerStyle}>
          <span style={nameStyle}>Schema: {name}</span>
        </div>
      )}
      <pre className="theme-code" style={preStyle}>
        <code>{schemaStr}</code>
      </pre>
      {example && (
        <>
          <div style={headerStyle}>
            <span className="theme-muted" style={labelStyle}>
              Example
            </span>
          </div>
          <pre className="theme-code" style={preStyle}>
            <code>{typeof example === "string" ? example : JSON.stringify(example, null, 2)}</code>
          </pre>
        </>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  boxShadow: "var(--docs-shadow)",
  overflow: "hidden",
  marginBlock: "0.5rem",
  maxWidth: "100%",
};

const headerStyle: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  background: "var(--docs-surface-hover)",
  borderBottom: "1px solid var(--docs-border)",
  fontSize: "0.75rem",
};

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: "1rem",
  fontSize: "0.8125rem",
  overflow: "auto",
  fontFamily: "var(--docs-font-mono)",
};
