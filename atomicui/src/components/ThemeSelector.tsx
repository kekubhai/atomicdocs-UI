"use client";

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { ThemeGeneratorModal } from "./ThemeGeneratorModal";

const THEME_LABELS: Record<string, string> = {
  terminal: "Terminal",
  paper: "Paper",
  ocean: "Ocean",
  sunset: "Sunset",
  monochrome: "Monochrome",
};

export function ThemeSelector() {
  const { theme, setTheme, themes, isCustomThemeActive } = useTheme();
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <>
      <div className="theme-selector" style={styles.wrapper}>
        <span className="theme-muted" style={styles.label}>
          Theme
        </span>
        <div style={styles.chips}>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-button ${t.id === theme ? "active" : ""}`}
              onClick={() => setTheme(t.id)}
              style={{
                ...styles.chip,
                borderRadius: "var(--docs-radius)",
                ...(t.id === theme ? styles.chipActive : {}),
                ...(t.isCustom ? styles.chipCustom : {}),
              }}
              title={THEME_LABELS[t.id] ?? t.label}
            >
              {t.isCustom && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: "4px" }}
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
              {t.label}
            </button>
          ))}
          
          {/* AI Theme Generator Button */}
          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            style={{
              ...styles.chip,
              ...styles.aiButton,
              borderRadius: "var(--docs-radius)",
            }}
            title="Generate theme from any website using AI"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <span>AI Theme</span>
          </button>
        </div>
      </div>

      <ThemeGeneratorModal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  label: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 0.875rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid var(--docs-border)",
    background: "var(--docs-surface)",
    color: "var(--docs-text)",
    transition: "background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s",
  },
  chipActive: {
    background: "var(--docs-accent-soft)",
    borderColor: "var(--docs-accent)",
    color: "var(--docs-accent)",
    boxShadow: "var(--docs-shadow)",
  },
  chipCustom: {
    background: "linear-gradient(135deg, var(--docs-accent-soft) 0%, var(--docs-surface) 100%)",
    borderStyle: "dashed",
  },
  aiButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    background: "linear-gradient(135deg, var(--docs-accent) 0%, color-mix(in srgb, var(--docs-accent) 70%, #8b5cf6) 100%)",
    color: "white",
    border: "none",
    boxShadow: "0 2px 8px var(--docs-accent-soft)",
  },
};
