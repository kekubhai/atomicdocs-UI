"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type GeneratedTheme,
  applyGeneratedTheme,
  removeCustomTheme,
} from "../lib/geminiThemeAnalyzer";

export type ThemeId = "terminal" | "paper" | "ocean" | "sunset" | "monochrome" | string;

const THEME_STORAGE_KEY = "atomicdocs-theme";
const CUSTOM_THEME_STORAGE_KEY = "atomicdocs-custom-theme";

const DEFAULT_THEMES: { id: ThemeId; label: string; isCustom?: boolean }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "paper", label: "Paper" },
  { id: "ocean", label: "Ocean" },
  { id: "sunset", label: "Sunset" },
  { id: "monochrome", label: "Monochrome" },
];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: { id: ThemeId; label: string; isCustom?: boolean }[];
  customTheme: GeneratedTheme | null;
  setCustomTheme: (theme: GeneratedTheme | null) => void;
  isCustomThemeActive: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "terminal";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  // Check if it's a default theme
  if (stored && DEFAULT_THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  // Check if it's a custom theme
  if (stored && stored.startsWith("custom-")) return stored;
  return "terminal";
}

function getStoredCustomTheme(): GeneratedTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as GeneratedTheme;
    }
  } catch (e) {
    console.error("Failed to parse custom theme:", e);
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);
  const [customTheme, setCustomThemeState] = useState<GeneratedTheme | null>(null);

  // Initialize custom theme from storage on mount
  useEffect(() => {
    const storedCustom = getStoredCustomTheme();
    if (storedCustom) {
      setCustomThemeState(storedCustom);
      // If the current theme ID matches the custom theme, apply it
      const storedThemeId = getStoredTheme();
      if (storedThemeId === storedCustom.id) {
        applyGeneratedTheme(storedCustom);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // If switching away from custom theme, we don't need to remove styles
    // as they won't apply anyway (different data-theme)
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    // If switching to custom theme, ensure it's applied
    if (id.startsWith("custom-") && customTheme && customTheme.id === id) {
      applyGeneratedTheme(customTheme);
    }
    setThemeState(id);
  }, [customTheme]);

  const setCustomTheme = useCallback((newTheme: GeneratedTheme | null) => {
    if (newTheme) {
      setCustomThemeState(newTheme);
      window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(newTheme));
      applyGeneratedTheme(newTheme);
      setThemeState(newTheme.id);
    } else {
      setCustomThemeState(null);
      window.localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
      removeCustomTheme();
      // Reset to default theme
      setThemeState("terminal");
    }
  }, []);

  // Build themes list including custom theme if present
  const themes = customTheme
    ? [...DEFAULT_THEMES, { id: customTheme.id, label: customTheme.label, isCustom: true }]
    : DEFAULT_THEMES;

  const isCustomThemeActive = theme.startsWith("custom-");

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes,
        customTheme,
        setCustomTheme,
        isCustomThemeActive,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
