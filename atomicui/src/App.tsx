"use client";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { ChatPanel } from "./components/ChatPanel";
import { TamboV1Provider } from "@tambo-ai/react/v1";
import { components, tools, openApiContextHelper } from "./lib/tambo";
import "./themes.css";
import "./App.css";

const apiKey =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_TAMBO_API_KEY
    ? String(import.meta.env.VITE_TAMBO_API_KEY).trim()
    : "";
const isPlaceholder =
  !apiKey || apiKey === "your_tambo_api_key_here" || apiKey.startsWith("your_");

function DocsLayout() {
  const { theme } = useTheme();

  return (
    <div className="app-theme" data-theme={theme} style={layoutStyle}>
      <header className="theme-header" style={headerStyle}>
        <h1 style={titleStyle}>API Docs</h1>
        <ThemeSelector />
      </header>
      <main style={mainStyle}>
        <ChatPanel />
      </main>
    </div>
  );
}

function App() {
  if (isPlaceholder) {
    return (
      <div style={errorWrapStyle}>
        <p style={errorStyle}>
          Set <code>VITE_TAMBO_API_KEY</code> in <code>.env.local</code> to your real Tambo API key.
        </p>
        <p style={hintStyle}>
          Copy the key from <code>TAMBO_API_KEY</code> (or get one at{" "}
          <a href="https://tambo.co/dashboard" target="_blank" rel="noopener noreferrer">
            tambo.co/dashboard
          </a>
          ) and add: <code>VITE_TAMBO_API_KEY=your_key_here</code>
        </p>
        <p style={smallStyle}>
          OpenAPI spec: <code>http://localhost:6174/docs</code> (ensure the Go server is running).
        </p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TamboV1Provider
        apiKey={apiKey}
        userKey="docs-user"
        components={components}
        tools={tools}
        contextHelpers={{ openApi: openApiContextHelper }}
      >
        <DocsLayout />
      </TamboV1Provider>
    </ThemeProvider>
  );
}

export default App;

const layoutStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "1rem",
  padding: "0.75rem 1.25rem",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "var(--docs-text)",
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  maxWidth: "56rem",
  margin: "0 auto",
  width: "100%",
  padding: "0 1rem",
};

const errorWrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  fontFamily: "system-ui, sans-serif",
  background: "#0d1117",
  color: "#e6edf3",
};

const errorStyle: React.CSSProperties = {
  fontSize: "1rem",
  marginBottom: "0.5rem",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  marginTop: 0,
  color: "#94a3b8",
};

const smallStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  marginTop: "1rem",
  color: "#64748b",
};
