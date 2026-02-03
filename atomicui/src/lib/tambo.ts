/**
 * Tambo configuration for API documentation UI
 * Components and tools for generative API docs (OpenAPI / AtomicDocs)
 * @see https://docs.tambo.co
 */

import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { defineTool } from "@tambo-ai/react";
import EndpointCard from "../components/tambo/EndpointCard";
import CodeSnippet from "../components/tambo/CodeSnippet";
import SchemaViewer from "../components/tambo/SchemaViewer";
import TryItPanel from "../components/tambo/TryItPanel";

// Go AtomicDocs server runs at :6174; spec is at /docs/json
const rawOpenApiUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAPI_URL
    ? String(import.meta.env.VITE_OPENAPI_URL).replace(/\/$/, "")
    : "http://localhost:6174/docs";

export const OPENAPI_URL = rawOpenApiUrl.endsWith("/docs")
  ? `${rawOpenApiUrl}`
  : rawOpenApiUrl.includes("/docs")
    ? rawOpenApiUrl
    : rawOpenApiUrl;

let specCache: Record<string, unknown> | null = null;
let specCacheTime = 0;
const CACHE_MS = 60_000;

export async function getOpenAPISpec(): Promise<Record<string, unknown>> {
  if (specCache && Date.now() - specCacheTime < CACHE_MS) {
    return specCache;
  }
  const res = await fetch(OPENAPI_URL, { mode: "cors" });
  if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec: ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  specCache = json;
  specCacheTime = Date.now();
  return json;
}

/** Context helper: inject OpenAPI spec into each message so the AI can answer about endpoints */
export const openApiContextHelper = async () => {
  try {
    const spec = await getOpenAPISpec();
    const paths = spec.paths as Record<string, unknown> | undefined;
    const summary = paths
      ? Object.entries(paths).flatMap(([path, item]) => {
          const p = item as Record<string, unknown>;
          return ["get", "post", "put", "patch", "delete"]
            .filter((m) => p[m])
            .map((m) => `${(m as string).toUpperCase()} ${path}`);
        })
      : [];
    return {
      openApiSpecSummary: summary,
      openApiInfo: spec.info,
      serverUrl: (spec.servers as { url?: string }[])?.[0]?.url,
    };
  } catch {
    return { openApiSpecSummary: [], openApiError: "Could not load OpenAPI spec" };
  }
};

function getBaseUrl(): string {
  try {
    const u = new URL(OPENAPI_URL);
    return `${u.origin.replace(/\/docs$/, "")}`;
  } catch {
    return "http://localhost:3000";
  }
}

export const components: TamboComponent[] = [
  {
    name: "EndpointCard",
    description:
      "Displays a single API endpoint with method, path, summary, parameters, request body, and responses. Use when the user asks about a specific endpoint (e.g. 'How do I create a user?', 'Show me POST /users').",
    component: EndpointCard,
    propsSchema: z.object({
      method: z.string().describe("HTTP method (GET, POST, PUT, PATCH, DELETE)"),
      path: z.string().describe("API path (e.g. /users, /users/:id)"),
      summary: z.string().optional().describe("Short summary of the endpoint"),
      description: z.string().optional().describe("Longer description"),
      parameters: z
        .array(
          z.object({
            name: z.string(),
            in: z.string().describe("path, query, header, or cookie"),
            required: z.boolean().optional(),
            description: z.string().optional(),
          })
        )
        .optional(),
      requestBody: z.string().optional().describe("JSON schema or example body"),
      responses: z
        .array(z.object({ code: z.string(), description: z.string() }))
        .optional()
        .describe("List of response codes and descriptions"),
    }),
  },
  {
    name: "CodeSnippet",
    description:
      "Shows a code block (e.g. curl, fetch, JavaScript). Use when the user asks for 'curl', 'example code', 'how to call this endpoint', or 'show me the request'.",
    component: CodeSnippet,
    propsSchema: z.object({
      code: z.string().describe("The code to display"),
      language: z.string().optional().describe("Language or type: curl, javascript, json, etc."),
      title: z.string().optional().describe("Optional title above the snippet"),
    }),
  },
  {
    name: "SchemaViewer",
    description:
      "Displays a JSON schema or structured data. Use when the user asks for 'schema', 'request body structure', 'response shape', or 'what fields does X have?'.",
    component: SchemaViewer,
    propsSchema: z.object({
      name: z.string().optional().describe("Schema name"),
      schema: z.any().describe("Schema object or JSON string"),
      example: z.any().optional().describe("Example value"),
    }),
  },
  {
    name: "TryItPanel",
    description:
      "Interactive 'Try it' panel: user can edit request body and send a real request to the API. Use when the user says 'let me try', 'try it', 'test this endpoint', or 'send a request'.",
    component: TryItPanel,
    propsSchema: z.object({
      method: z.string().describe("HTTP method"),
      path: z.string().describe("API path"),
      baseUrl: z.string().optional().describe("Base URL of the API (e.g. http://localhost:3000)"),
      requestBody: z.string().optional().describe("Default request body JSON"),
    }),
  },
];

export const tools: TamboTool[] = [
  defineTool({
    name: "get_openapi_spec",
    description:
      "Fetch the full OpenAPI specification for the API. Use when you need an overview of all endpoints, servers, or info.",
    tool: async () => getOpenAPISpec(),
    inputSchema: z.object({}),
    outputSchema: z.record(z.unknown()),
  }),
  defineTool({
    name: "list_endpoints",
    description:
      "List API endpoints from the OpenAPI spec. Optionally filter by tag or path prefix. Returns array of { method, path, summary }.",
    tool: async ({ tag, pathPrefix }) => {
      const spec = await getOpenAPISpec();
      const paths = (spec.paths as Record<string, Record<string, unknown>>) ?? {};
      const list: { method: string; path: string; summary?: string }[] = [];
      for (const [path, pathItem] of Object.entries(paths)) {
        if (pathPrefix && !path.startsWith(pathPrefix)) continue;
        const methods = ["get", "post", "put", "patch", "delete"] as const;
        for (const method of methods) {
          const op = pathItem[method] as Record<string, unknown> | undefined;
          if (!op) continue;
          if (tag && Array.isArray(op.tags) && !op.tags.includes(tag)) continue;
          list.push({
            method: method.toUpperCase(),
            path,
            summary: op.summary as string | undefined,
          });
        }
      }
      return list;
    },
    inputSchema: z.object({
      tag: z.string().optional().describe("Filter by OpenAPI tag"),
      pathPrefix: z.string().optional().describe("Filter paths starting with this prefix"),
    }),
    outputSchema: z.array(
      z.object({
        method: z.string(),
        path: z.string(),
        summary: z.string().optional(),
      })
    ),
  }),
  defineTool({
    name: "get_endpoint",
    description:
      "Get full details for one endpoint (path + method). Use to show EndpointCard or answer 'how do I call X?'.",
    tool: async ({ path, method }) => {
      const spec = await getOpenAPISpec();
      const paths = (spec.paths as Record<string, Record<string, unknown>>) ?? {};
      const pathItem = paths[path];
      if (!pathItem) return null;
      const op = pathItem[(method ?? "get").toLowerCase()] as Record<string, unknown> | undefined;
      if (!op) return null;
      const parameters = (op.parameters as Array<Record<string, unknown>>) ?? [];
      const params = parameters.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.required,
        description: p.description,
      }));
      let requestBody = "";
      const rb = op.requestBody as Record<string, Record<string, { schema?: unknown }>> | undefined;
      if (rb?.content?.["application/json"]?.schema) {
        requestBody = JSON.stringify(rb.content["application/json"].schema, null, 2);
      }
      const responsesObj = (op.responses as Record<string, { description?: string }>) ?? {};
      const resp: Record<string, string> = {};
      for (const [code, r] of Object.entries(responsesObj)) {
        resp[code] = typeof r?.description === "string" ? r.description : "—";
      }
      return {
        method: (method ?? "GET").toUpperCase(),
        path,
        summary: op.summary,
        description: op.description,
        parameters: params,
        requestBody: requestBody || undefined,
        responses: resp,
      };
    },
    inputSchema: z.object({
      path: z.string().describe("API path, e.g. /users"),
      method: z.string().optional().describe("HTTP method, default GET"),
    }),
    outputSchema: z
      .object({
        method: z.string(),
        path: z.string(),
        summary: z.unknown(),
        description: z.unknown(),
        parameters: z.array(z.unknown()),
        requestBody: z.string().optional(),
        responses: z.record(z.string()),
      })
      .nullable(),
  }),
  defineTool({
    name: "get_schema",
    description:
      "Get a schema by name from components.schemas. Use when the user asks for 'request body schema', 'response schema', or a named schema.",
    tool: async ({ schemaName }) => {
      const spec = await getOpenAPISpec();
      const componentsObj = spec.components as Record<string, Record<string, unknown>> | undefined;
      const schemas = componentsObj?.schemas ?? {};
      const s = (schemas as Record<string, unknown>)[schemaName];
      return s ?? null;
    },
    inputSchema: z.object({
      schemaName: z.string().describe("Name of the schema in components.schemas"),
    }),
    outputSchema: z.record(z.unknown()).nullable(),
  }),
  defineTool({
    name: "generate_curl",
    description:
      "Generate a curl command for an endpoint. Use when the user asks for 'curl', 'curl example', or 'command line'.",
    tool: async ({ path, method, body }) => {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
      const m = (method ?? "GET").toUpperCase();
      let curl = `curl -X ${m} "${url}"`;
      if (body && m !== "GET") {
        const escaped = JSON.stringify(body).replace(/"/g, '\\"');
        curl += ` -H "Content-Type: application/json" -d "${escaped}"`;
      }
      return curl;
    },
    inputSchema: z.object({
      path: z.string().describe("API path"),
      method: z.string().optional().describe("HTTP method, default GET"),
      body: z.any().optional().describe("Request body as object (for POST/PUT/PATCH)"),
    }),
    outputSchema: z.string(),
  }),
];
