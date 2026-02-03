import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

type ErrorBoundaryState = { hasError: boolean; error: Error | null };

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const err = this.state.error;
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "#0d1117",
            color: "#e6edf3",
            maxWidth: "42rem",
            margin: "0 auto",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>Something went wrong</h2>
          <pre
            style={{
              color: "#f87171",
              fontSize: "0.8125rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              textAlign: "left",
              marginBottom: "1rem",
              padding: "1rem",
              background: "#1c1917",
              borderRadius: "6px",
            }}
          >
            {err.message}
          </pre>
          <p style={{ color: "#8b949e", fontSize: "0.875rem", textAlign: "center" }}>
            Ensure <code>VITE_TAMBO_API_KEY</code> is set in .env.local and restart <code>npm run dev</code>. Go server: <code>http://localhost:6174</code>.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
