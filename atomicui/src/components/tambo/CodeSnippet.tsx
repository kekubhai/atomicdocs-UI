"use client";

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeSnippet({
  code,
  language = "text",
  title,
}: CodeSnippetProps) {
  return (
    <div className="theme-surface" style={wrapperStyle}>
      {(title || language) && (
        <div style={headerStyle}>
          {title && <span style={titleStyle}>{title}</span>}
          <span className="theme-muted" style={langStyle}>
            {language}
          </span>
        </div>
      )}
      <pre className="theme-code" style={preStyle}>
        <code>{code}</code>
      </pre>
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.375rem 0.75rem",
  background: "var(--docs-surface-hover)",
  borderBottom: "1px solid var(--docs-border)",
  fontSize: "0.75rem",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
};

const langStyle: React.CSSProperties = {
  fontFamily: "var(--docs-font-mono)",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: "1rem",
  fontSize: "0.8125rem",
  overflow: "auto",
  fontFamily: "var(--docs-font-mono)",
};
