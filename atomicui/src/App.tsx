"use client";

import { useState } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { ChatPanel } from "./components/ChatPanel";
import ApiShowcase from "./components/ApiShowcase";
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

type ViewMode = "chat" | "showcase";

function DocsLayout() {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("showcase");

  console.log("DocsLayout rendering, viewMode:", viewMode, "theme:", theme);

  return (
    <div className="app-theme" data-theme={theme} style={layoutStyle}>
      <header className="theme-header" style={headerStyle}>
        <div style={headerLeftStyle}>
          <h1 style={titleStyle}>API Docs</h1>
          <nav style={navStyle}>
            <button
              onClick={() => setViewMode("showcase")}
              style={{
                ...navButtonStyle,
                ...(viewMode === "showcase" ? navButtonActiveStyle : {})
              }}
              className={viewMode === "showcase" ? "theme-button active" : "theme-button"}
            >
              Browse APIs
            </button>
            <button
              onClick={() => setViewMode("chat")}
              style={{
                ...navButtonStyle,
                ...(viewMode === "chat" ? navButtonActiveStyle : {})
              }}
              className={viewMode === "chat" ? "theme-button active" : "theme-button"}
            >
              Ask AI
            </button>
          </nav>
        </div>
        <ThemeSelector />
      </header>
      <main style={{
        ...mainStyle,
        maxWidth: viewMode === "showcase" ? "100%" : "56rem",
        padding: viewMode === "showcase" ? 0 : "0 1rem",
      }}>
        {viewMode === "showcase" ? <ApiShowcase /> : <ChatPanel />}
      </main>
    </div>
  );
}

function App() {
  console.log("App rendering, isPlaceholder:", isPlaceholder, "apiKey exists:", !!apiKey);
  
  return (
    <ThemeProvider>
      {isPlaceholder ? (
        <DocsLayoutWithoutTambo />
      ) : (
        <TamboV1Provider
          apiKey={apiKey}
          userKey="docs-user"
          components={components}
          tools={tools}
          contextHelpers={{ openApi: openApiContextHelper }}
        >
          <DocsLayout />
        </TamboV1Provider>
      )}
    </ThemeProvider>
  );
}

function DocsLayoutWithoutTambo() {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("showcase");

  console.log("DocsLayoutWithoutTambo rendering, viewMode:", viewMode, "theme:", theme);

  return (
    <div className="app-theme" data-theme={theme} style={layoutStyle}>
      <header className="theme-header" style={headerStyle}>
        <div style={headerLeftStyle}>
          <h1 style={titleStyle}>API Docs</h1>
          <nav style={navStyle}>
            <button
              onClick={() => setViewMode("showcase")}
              style={{
                ...navButtonStyle,
                ...(viewMode === "showcase" ? navButtonActiveStyle : {})
              }}
              className={viewMode === "showcase" ? "theme-button active" : "theme-button"}
            >
              Browse APIs
            </button>
            <button
              onClick={() => setViewMode("chat")}
              style={{
                ...navButtonStyle,
                ...(viewMode === "chat" ? navButtonActiveStyle : {})
              }}
              className={viewMode === "chat" ? "theme-button active" : "theme-button"}
              disabled
              title="Requires Tambo API key"
            >
              Ask AI (Requires API Key)
            </button>
          </nav>
        </div>
        <ThemeSelector />
      </header>
      <main style={{
        ...mainStyle,
        maxWidth: viewMode === "showcase" ? "100%" : "56rem",
        padding: viewMode === "showcase" ? 0 : "0 1rem",
      }}>
        {viewMode === "showcase" ? (
          <ApiShowcase />
        ) : (
          <div style={errorWrapStyle}>
            <p style={errorStyle}>
              Set <code>VITE_TAMBO_API_KEY</code> in <code>.env.local</code> to use the AI chat feature.
            </p>
            <p style={hintStyle}>
              Get your API key at{" "}
              <a href="https://tambo.co/dashboard" target="_blank" rel="noopener noreferrer">
                tambo.co/dashboard
              </a>
              {" "}and add: <code>VITE_TAMBO_API_KEY=your_key_here</code>
            </p>
            <button
              onClick={() => setViewMode("showcase")}
              style={clearButtonStyle}
              className="theme-button"
            >
              Browse APIs Instead
            </button>
          </div>
        )}
      </main>
    </div>
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

const headerLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2rem",
  flexWrap: "wrap",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};

const navButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid var(--docs-border)",
  background: "var(--docs-surface)",
  color: "var(--docs-text)",
  transition: "all 0.2s ease",
};

const navButtonActiveStyle: React.CSSProperties = {
  background: "var(--docs-accent-soft)",
  borderColor: "var(--docs-accent)",
  color: "var(--docs-accent)",
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  margin: "0 auto",
  width: "100%",
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

const clearButtonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "1rem",
};
