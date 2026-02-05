"use client";

import { useState, type CSSProperties } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  analyzeWebsiteTheme,
  type ThemeAnalysisResult,
} from "../lib/geminiThemeAnalyzer";

interface ThemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GEMINI_API_KEY_STORAGE = "atomicdocs-gemini-key";

export function ThemeGeneratorModal({ isOpen, onClose }: ThemeGeneratorModalProps) {
  const { setCustomTheme, customTheme } = useTheme();
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
    }
    return "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThemeAnalysisResult | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your Gemini API key");
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Save API key for future use
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);

    const analysisResult = await analyzeWebsiteTheme(url, apiKey);
    
    setIsLoading(false);
    setResult(analysisResult);

    if (!analysisResult.success) {
      setError(analysisResult.error || "Analysis failed");
    }
  };

  const handleApplyTheme = () => {
    if (result?.theme) {
      setCustomTheme(result.theme);
      onClose();
    }
  };

  const handleClearCustomTheme = () => {
    setCustomTheme(null);
    setResult(null);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div>
              <h2 style={styles.title}>AI Theme Generator</h2>
              <p style={styles.subtitle}>Powered by Gemini AI</p>
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <p style={styles.description}>
            Enter any website URL and our AI will analyze its design system — colors, 
            typography, and styling — to generate a matching theme for your API docs.
          </p>

          {/* URL Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Website URL</label>
            <div style={styles.inputWrapper}>
              <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://stripe.com"
                style={styles.input}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Get free API key →
                </a>
              </div>
              <div style={styles.inputWrapper}>
                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>
              <p style={styles.hint}>Your API key is stored locally and never sent to our servers.</p>
            </div>
          )}

          {!showApiKeyInput && apiKey && (
            <button
              style={styles.textButton}
              onClick={() => setShowApiKeyInput(true)}
            >
              Change API key
            </button>
          )}

          {/* Error */}
          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <div>
                <p style={styles.loadingText}>Analyzing website design...</p>
                <p style={styles.loadingHint}>This may take 10-20 seconds</p>
              </div>
            </div>
          )}

          {/* Result Preview */}
          {result?.success && result.theme && (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--docs-accent)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span style={styles.resultTitle}>Theme Generated!</span>
              </div>
              
              {result.websiteInfo && (
                <p style={styles.resultMeta}>
                  Based on: <strong>{result.websiteInfo.title}</strong>
                  {result.websiteInfo.description && ` — ${result.websiteInfo.description}`}
                </p>
              )}

              {/* Color Preview */}
              <div style={styles.colorGrid}>
                <ColorSwatch label="Background" color={result.theme.colors.bg} />
                <ColorSwatch label="Surface" color={result.theme.colors.surface} />
                <ColorSwatch label="Accent" color={result.theme.colors.accent} />
                <ColorSwatch label="Text" color={result.theme.colors.text} />
                <ColorSwatch label="Muted" color={result.theme.colors.textMuted} />
                <ColorSwatch label="Border" color={result.theme.colors.border} />
              </div>

              <div style={styles.resultInfo}>
                <span>Radius: {result.theme.radius}</span>
                <span>•</span>
                <span>Weight: {result.theme.fontWeight}</span>
              </div>
            </div>
          )}

          {/* Current Custom Theme */}
          {customTheme && !result && (
            <div style={styles.currentTheme}>
              <div style={styles.currentThemeHeader}>
                <span>Current Custom Theme: </span>
                <strong>{customTheme.label}</strong>
              </div>
              <button
                style={styles.clearButton}
                onClick={handleClearCustomTheme}
              >
                Remove custom theme
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          {result?.success ? (
            <button style={styles.primaryButton} onClick={handleApplyTheme}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Apply Theme
            </button>
          ) : (
            <button
              style={{
                ...styles.primaryButton,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div style={styles.buttonSpinner}></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate Theme
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={styles.colorSwatch}>
      <div
        style={{
          ...styles.colorPreview,
          backgroundColor: color,
        }}
        title={color}
      />
      <span style={styles.colorLabel}>{label}</span>
      <span style={styles.colorValue}>{color}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "var(--docs-surface)",
    borderRadius: "16px",
    border: "1px solid var(--docs-border)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.2s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--docs-border)",
    background: "linear-gradient(135deg, var(--docs-accent-soft) 0%, transparent 100%)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
  },
  iconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, var(--docs-accent) 0%, var(--docs-accent-soft) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  title: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--docs-text)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.8125rem",
    color: "var(--docs-text-muted)",
    marginTop: "2px",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "8px",
    color: "var(--docs-text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  body: {
    padding: "1.5rem",
    overflowY: "auto",
    flex: 1,
  },
  description: {
    margin: "0 0 1.5rem 0",
    fontSize: "0.9375rem",
    lineHeight: 1.6,
    color: "var(--docs-text-muted)",
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  label: {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--docs-text)",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  link: {
    fontSize: "0.8125rem",
    color: "var(--docs-accent)",
    textDecoration: "none",
    fontWeight: 500,
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--docs-text-muted)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem 0.875rem 2.75rem",
    fontSize: "0.9375rem",
    border: "1px solid var(--docs-border)",
    borderRadius: "10px",
    backgroundColor: "var(--docs-bg)",
    color: "var(--docs-text)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  hint: {
    margin: "0.5rem 0 0 0",
    fontSize: "0.75rem",
    color: "var(--docs-text-muted)",
  },
  textButton: {
    background: "none",
    border: "none",
    color: "var(--docs-accent)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    marginBottom: "1rem",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1rem",
    borderRadius: "10px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem",
    borderRadius: "12px",
    backgroundColor: "var(--docs-accent-soft)",
    border: "1px solid var(--docs-accent)",
    marginBottom: "1rem",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid var(--docs-border)",
    borderTopColor: "var(--docs-accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  loadingText: {
    margin: 0,
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--docs-text)",
  },
  loadingHint: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.8125rem",
    color: "var(--docs-text-muted)",
  },
  resultCard: {
    padding: "1.25rem",
    borderRadius: "12px",
    backgroundColor: "var(--docs-bg)",
    border: "1px solid var(--docs-accent)",
    marginBottom: "1rem",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  resultTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--docs-accent)",
  },
  resultMeta: {
    margin: "0 0 1rem 0",
    fontSize: "0.875rem",
    color: "var(--docs-text-muted)",
    lineHeight: 1.5,
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  colorSwatch: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.375rem",
  },
  colorPreview: {
    width: "100%",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid var(--docs-border)",
  },
  colorLabel: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--docs-text-muted)",
  },
  colorValue: {
    fontSize: "0.6875rem",
    fontFamily: "var(--docs-font-mono)",
    color: "var(--docs-text-muted)",
  },
  resultInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    fontSize: "0.8125rem",
    color: "var(--docs-text-muted)",
  },
  currentTheme: {
    padding: "1rem",
    borderRadius: "10px",
    backgroundColor: "var(--docs-bg)",
    border: "1px solid var(--docs-border)",
    marginBottom: "1rem",
  },
  currentThemeHeader: {
    fontSize: "0.875rem",
    color: "var(--docs-text-muted)",
    marginBottom: "0.75rem",
  },
  clearButton: {
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid var(--docs-border)",
    backgroundColor: "var(--docs-bg)",
  },
  cancelButton: {
    padding: "0.75rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    border: "1px solid var(--docs-border)",
    borderRadius: "10px",
    backgroundColor: "transparent",
    color: "var(--docs-text-muted)",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, var(--docs-accent) 0%, color-mix(in srgb, var(--docs-accent) 80%, black) 100%)",
    color: "white",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 2px 8px var(--docs-accent-soft)",
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default ThemeGeneratorModal;
