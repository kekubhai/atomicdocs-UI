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
    // First, fetch the website content
    const websiteContent = await fetchWebsiteContent(url);
    
    if (!websiteContent.success) {
      return { success: false, error: websiteContent.error };
    }

    // Analyze with Gemini
    const analysis = await callGeminiForThemeAnalysis(
      url,
      websiteContent.html || "",
      websiteContent.css || "",
      apiKey
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

/**
 * Fetches website content for analysis
 */
async function fetchWebsiteContent(url: string): Promise<{
  success: boolean;
  html?: string;
  css?: string;
  error?: string;
}> {
  try {
    // Use a CORS proxy or server-side endpoint in production
    // For demo purposes, we'll use a public CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const data = await response.json();
    const html = data.contents || "";

    // Extract inline styles and style tags
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const css = styleMatches.join("\n");

    return { success: true, html: html.substring(0, 50000), css: css.substring(0, 10000) };
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      success: false,
      error: "Could not fetch website content. The website may block external access.",
    };
  }
}

/**
 * Calls Gemini API to analyze the website and generate theme
 */
async function callGeminiForThemeAnalysis(
  url: string,
  html: string,
  css: string,
  apiKey: string
): Promise<ThemeAnalysisResult> {
  // Extract only relevant style information to reduce token usage
  const relevantHtml = html.substring(0, 4000);
  const relevantCss = css.substring(0, 1500);
  
  const prompt = `Analyze this website's design and extract colors for a theme.

URL: ${url}

HTML:
${relevantHtml}

CSS:
${relevantCss}

Return ONLY this JSON (no markdown, no explanation):
{"websiteTitle":"Name","websiteDescription":"5 words max","dominantColors":["#hex","#hex","#hex"],"theme":{"bg":"#hex","surface":"#hex","surfaceHover":"#hex","text":"#hex","textMuted":"#hex","accent":"#hex","accentSoft":"rgba(0,0,0,0.15)","border":"#hex","codeBg":"#hex","radius":"8px","shadow":"0 2px 8px rgba(0,0,0,0.1)","fontWeight":"500"}}`;

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
    // Use a more robust pattern that handles incomplete code blocks too
    if (jsonString.startsWith("```")) {
      // Remove opening ``` or ```json
      jsonString = jsonString.replace(/^```(?:json)?\s*\n?/, "");
      // Remove closing ``` if present
      jsonString = jsonString.replace(/\n?```\s*$/, "");
    }
    
    // Try to extract JSON object - use non-greedy match to get first complete object
    const jsonMatch = jsonString.match(/\{[\s\S]*?\}(?=\s*$|\s*\n|$)/);
    
    // If that didn't work, try to find any JSON object
    if (!jsonMatch) {
      const fallbackMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!fallbackMatch) {
        console.error("Failed to find JSON in response:", textResponse);
        throw new Error("Could not parse Gemini response. Please try again.");
      }
      // Use the fallback match
      jsonString = fallbackMatch[0];
    } else {
      jsonString = jsonMatch[0];
    }

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
    const extractedTheme: GeneratedTheme = {
      id: themeId,
      label: themeName,
      colors: {
        bg: themeData.bg || "#0a0a0a",
        surface: themeData.surface || "#1a1a1a",
        surfaceHover: themeData.surfaceHover || themeData.surface || "#2a2a2a",
        text: themeData.text || "#ffffff",
        textMuted: themeData.textMuted || "#888888",
        accent: themeData.accent || "#3b82f6",
        accentSoft: themeData.accentSoft || `${themeData.accent}33` || "rgba(59, 130, 246, 0.2)",
        border: themeData.border || "#333333",
        codeBg: themeData.codeBg || themeData.surface || "#1a1a1a",
      },
      radius: themeData.radius || "8px",
      shadow: themeData.shadow || "0 4px 12px rgba(0, 0, 0, 0.15)",
      fontWeight: themeData.fontWeight || "500",
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
    }
  `;

  // Apply the theme
  root.setAttribute("data-theme", theme.id);
}

/**
 * Removes custom theme styles
 */
export function removeCustomTheme(): void {
  const styleEl = document.getElementById("custom-theme-styles");
  if (styleEl) {
    styleEl.remove();
  }
}
