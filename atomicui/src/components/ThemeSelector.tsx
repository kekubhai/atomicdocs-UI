"use client";

import { useTheme } from "../context/ThemeContext";

const THEME_LABELS: Record<string, string> = {
  terminal: "Terminal",
  paper: "Paper",
  ocean: "Ocean",
  sunset: "Sunset",
  monochrome: "Monochrome",
};

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();

  return (
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
            }}
            title={THEME_LABELS[t.id] ?? t.label}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
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
};
