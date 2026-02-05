/**
 * Gemini-powered website theme analyzer
 * Analyzes a website's design and generates a matching theme
 */

export interface GeneratedTheme {
  id: string;
  label: string;
  colors: {
    bg: string;
    surface: string;
    surfaceHover: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    border: string;
    codeBg: string;
  };
  radius: string;
  shadow: string;
  fontWeight: string;
  /** Typography from analyzed site (optional for themes saved before this was added) */
  typography?: {
    fontSans: string;
    fontMono: string;
    fontSizeBase: string;
    lineHeight: string;
    letterSpacing: string;
    headingWeight: string;
  };
}

export interface ThemeAnalysisResult {
  success: boolean;
  theme?: GeneratedTheme;
  error?: string;
  websiteInfo?: {
    title: string;
    description: string;
    dominantColors: string[];
  };
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Analyzes a website URL and generates a matching theme using Gemini AI
 */
export async function analyzeWebsiteTheme(
  url: string,
  apiKey: string
): Promise<ThemeAnalysisResult> {
  if (!apiKey) {
    return { success: false, error: "Gemini API key is required" };
  }

  if (!url || !isValidUrl(url)) {
    return { success: false, error: "Please enter a valid URL" };
  }

  try {
    // Try to fetch website content via CORS proxies
    const websiteContent = await fetchWebsiteContent(url);
    
    // Analyze with Gemini (with or without HTML/CSS)
    const analysis = await callGeminiForThemeAnalysis(
      url,
      websiteContent.html || "",
      websiteContent.css || "",
      apiKey,
      !websiteContent.success
    );

    return analysis;
  } catch (error) {
    console.error("Theme analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze website",
    };
  }
}

/** CORS proxies: [url, expectJson]. Try in order. */
const CORS_PROXIES: Array<{ buildUrl: (url: string) => string; expectJson: boolean }> = [
  { buildUrl: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`, expectJson: false },
  { buildUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, expectJson: false },
  { buildUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, expectJson: true },
];

/**
 * Fetches website content for analysis via CORS proxies
 */
async function fetchWebsiteContent(url: string): Promise<{
  success: boolean;
  html?: string;
  css?: string;
  error?: string;
}> {
  const errors: string[] = [];

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.buildUrl(url);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: { Accept: proxy.expectJson ? "application/json" : "text/html" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`${response.status}`);
        continue;
      }

      let html: string;
      if (proxy.expectJson) {
        const data = await response.json();
        html = data.contents ?? "";
      } else {
        html = await response.text();
      }

      if (!html || html.length < 100) {
        errors.push("empty or too short");
        continue;
      }

      const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
      const css = styleMatches.join("\n");

      return { success: true, html: html.substring(0, 50000), css: css.substring(0, 10000) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      continue;
    }
  }

  console.warn("All CORS proxies failed:", errors);
  return {
    success: false,
    error: "Could not fetch the website (CORS or network). Generating theme from URL only.",
  };
}

/**
 * Calls Gemini API to analyze the website and generate theme
 * @param urlOnlyFallback - if true, no HTML/CSS was fetched; infer theme from URL/domain only
 */
async function callGeminiForThemeAnalysis(
  url: string,
  html: string,
  css: string,
  apiKey: string,
  urlOnlyFallback = false
): Promise<ThemeAnalysisResult> {
  const hasContent = !urlOnlyFallback && (html.length > 50 || css.length > 0);
  const relevantHtml = html.substring(0, 4000);
  const relevantCss = css.substring(0, 1500);

  const jsonSchema = `{"websiteTitle":"Name","websiteDescription":"5 words","dominantColors":["#hex","#hex","#hex"],"theme":{"bg":"#hex","surface":"#hex","surfaceHover":"#hex","text":"#hex","textMuted":"#hex","accent":"#hex","accentSoft":"rgba(0,0,0,0.15)","border":"#hex","codeBg":"#hex","radius":"8px","shadow":"0 2px 8px rgba(0,0,0,0.1)","fontWeight":"500","fontSans":"Inter, system-ui, sans-serif","fontMono":"JetBrains Mono, monospace","fontSizeBase":"16px","lineHeight":"1.5","letterSpacing":"normal","headingWeight":"600"}}`;

  const prompt = hasContent
    ? `Analyze this website's design: colors AND typography (fonts, sizes, line-height, letter-spacing). Extract from HTML/CSS: body font-family, heading font-family/weight, base font-size, line-height, letter-spacing. Code blocks: monospace font.

URL: ${url}

HTML:
${relevantHtml}

CSS:
${relevantCss}

Return ONLY this JSON (no markdown):
${jsonSchema}

Use actual font names from the site (e.g. "Inter", "Roboto", "Space Grotesk"). If none found use "Inter, system-ui, sans-serif" and "JetBrains Mono, monospace". fontSizeBase like "16px", lineHeight like "1.5" or "1.6", letterSpacing "normal" or "-0.02em", headingWeight "600" or "700".`
    : `Create an API docs theme from this URL only (page not fetched). Infer typography: modern sans (e.g. Inter, system-ui), mono for code, readable base size and line-height.

URL: ${url}

Return ONLY this JSON (no markdown):
${jsonSchema}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Gemini API error: ${response.status}`
      );
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("Gemini raw response:", textResponse);

    // Parse the JSON response - handle markdown code blocks
    let jsonString = textResponse.trim();
    
    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```(?:json)?\s*\n?/, "");
      jsonString = jsonString.replace(/\n?```\s*$/, "");
    }
    
    // Extract first complete JSON object by brace-matching (ignores trailing text)
    const extracted = extractFirstJsonObject(jsonString);
    if (!extracted) {
      console.error("Failed to find JSON in response:", textResponse);
      throw new Error("Could not parse Gemini response. Please try again.");
    }
    jsonString = extracted;

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw JSON:", jsonString);
      throw new Error("Invalid JSON in Gemini response. Please try again.");
    }
    
    // Validate required fields
    if (!parsed.theme) {
      console.error("Missing theme object in response:", parsed);
      throw new Error("Gemini response missing theme data. Please try again.");
    }

    // Generate a unique theme ID
    const themeId = `custom-${Date.now()}`;
    const themeName = parsed.websiteTitle
      ? `${parsed.websiteTitle.substring(0, 20)} Style`
      : "Custom Theme";

    // Extract theme with fallbacks for missing fields
    const themeData = parsed.theme;
    const t = themeData;
    const extractedTheme: GeneratedTheme = {
      id: themeId,
      label: themeName,
      colors: {
        bg: t.bg || "#0a0a0a",
        surface: t.surface || "#1a1a1a",
        surfaceHover: t.surfaceHover || t.surface || "#2a2a2a",
        text: t.text || "#ffffff",
        textMuted: t.textMuted || "#888888",
        accent: t.accent || "#3b82f6",
        accentSoft: t.accentSoft || "rgba(59, 130, 246, 0.2)",
        border: t.border || "#333333",
        codeBg: t.codeBg || t.surface || "#1a1a1a",
      },
      radius: t.radius || "8px",
      shadow: t.shadow || "0 4px 12px rgba(0, 0, 0, 0.15)",
      fontWeight: t.fontWeight || "500",
      typography: {
        fontSans: t.fontSans || "Inter, system-ui, -apple-system, sans-serif",
        fontMono: t.fontMono || "JetBrains Mono, ui-monospace, monospace",
        fontSizeBase: t.fontSizeBase || "16px",
        lineHeight: t.lineHeight || "1.5",
        letterSpacing: t.letterSpacing ?? "normal",
        headingWeight: t.headingWeight || "600",
      },
    };

    console.log("Generated theme:", extractedTheme);

    return {
      success: true,
      theme: extractedTheme,
      websiteInfo: {
        title: parsed.websiteTitle || "Unknown",
        description: parsed.websiteDescription || "",
        dominantColors: parsed.dominantColors || [],
      },
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze with Gemini",
    };
  }
}

/**
 * Extracts the first complete JSON object from a string by brace-matching.
 * Ignores trailing content (e.g. Gemini adding text after the JSON).
 */
function extractFirstJsonObject(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let quoteChar = "";

  for (let i = start; i < str.length; i++) {
    const c = str[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === quoteChar) inString = false;
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      quoteChar = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Validates a URL string
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Applies a generated theme to the document
 */
export function applyGeneratedTheme(theme: GeneratedTheme): void {
  const root = document.documentElement;
  
  // Create a style element for the custom theme
  let styleEl = document.getElementById("custom-theme-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "custom-theme-styles";
    document.head.appendChild(styleEl);
  }

  const ty = theme.typography ?? {
    fontSans: "Inter, system-ui, -apple-system, sans-serif",
    fontMono: "JetBrains Mono, ui-monospace, monospace",
    fontSizeBase: "16px",
    lineHeight: "1.5",
    letterSpacing: "normal",
    headingWeight: "600",
  };
  const safeFontSans = (ty.fontSans ?? "").replace(/"/g, "'");
  const safeFontMono = (ty.fontMono ?? "").replace(/"/g, "'");
  styleEl.textContent = `
    [data-theme="${theme.id}"] {
      --docs-bg: ${theme.colors.bg};
      --docs-surface: ${theme.colors.surface};
      --docs-surface-hover: ${theme.colors.surfaceHover};
      --docs-text: ${theme.colors.text};
      --docs-text-muted: ${theme.colors.textMuted};
      --docs-accent: ${theme.colors.accent};
      --docs-accent-soft: ${theme.colors.accentSoft};
      --docs-border: ${theme.colors.border};
      --docs-code-bg: ${theme.colors.codeBg};
      --docs-radius: ${theme.radius};
      --docs-shadow: ${theme.shadow};
      --docs-font-weight: ${theme.fontWeight};
      --docs-header-border: 2px solid var(--docs-accent);
      --docs-font-sans: ${safeFontSans || "Inter, system-ui, sans-serif"};
      --docs-font-mono: ${safeFontMono || "JetBrains Mono, monospace"};
      --docs-font-size-base: ${ty.fontSizeBase || "16px"};
      --docs-line-height: ${ty.lineHeight || "1.5"};
      --docs-letter-spacing: ${ty.letterSpacing ?? "normal"};
      --docs-heading-weight: ${ty.headingWeight || "600"};
    }
  `;

  // Load Google Fonts when theme uses common web fonts
  ensureGoogleFontsLoaded(safeFontSans, safeFontMono);

  root.setAttribute("data-theme", theme.id);
}

/** Google Fonts that we can load by name */
const GOOGLE_FONTS_MAP: Record<string, string> = {
  Inter: "Inter",
  Roboto: "Roboto",
  "Open Sans": "Open+Sans",
  "Space Grotesk": "Space+Grotesk",
  "JetBrains Mono": "JetBrains+Mono",
  "Fira Code": "Fira+Code",
  Lato: "Lato",
  Poppins: "Poppins",
  Montserrat: "Montserrat",
  "Source Sans 3": "Source+Sans+3",
};

function ensureGoogleFontsLoaded(sans: string, mono: string): void {
  const families = new Set<string>();
  for (const [displayName, param] of Object.entries(GOOGLE_FONTS_MAP)) {
    if (sans.includes(displayName) || mono.includes(displayName)) families.add(param);
  }
  if (families.size === 0) return;
  const query = Array.from(families).map((f) => `family=${f}:wght@400;500;600;700`).join("&");
  const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  let link = document.getElementById("custom-theme-fonts") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = "custom-theme-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Removes custom theme styles and loaded fonts
 */
export function removeCustomTheme(): void {
  const styleEl = document.getElementById("custom-theme-styles");
  if (styleEl) styleEl.remove();
  const fontEl = document.getElementById("custom-theme-fonts");
  if (fontEl) fontEl.remove();
}
