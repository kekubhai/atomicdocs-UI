"use client";

import { useState, useMemo } from "react";
import { mockApis, type MockEndpoint } from "../data/mockApis";
import EndpointCard from "./tambo/EndpointCard";
import CodeSnippet from "./tambo/CodeSnippet";
import SchemaViewer from "./tambo/SchemaViewer";
import TryItPanel from "./tambo/TryItPanel";

export default function ApiShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [selectedEndpoint, setSelectedEndpoint] = useState<MockEndpoint | null>(null);

  // Debug: Log if component renders
  console.log("ApiShowcase rendering, mockApis count:", mockApis.length);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockApis.forEach(api => {
      api.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  // Filter APIs based on search and tag
  const filteredApis = useMemo(() => {
    return mockApis.filter(api => {
      const matchesSearch = 
        api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.method.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = !selectedTag || api.tags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  // Group APIs by tag
  const groupedApis = useMemo(() => {
    const groups: Record<string, MockEndpoint[]> = {};
    filteredApis.forEach(api => {
      const tag = api.tags?.[0] || "Other";
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(api);
    });
    return groups;
  }, [filteredApis]);

  const toggleEndpoint = (endpoint: MockEndpoint) => {
    const key = `${endpoint.method}-${endpoint.path}`;
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
      if (selectedEndpoint === endpoint) setSelectedEndpoint(null);
    } else {
      newExpanded.add(key);
      setSelectedEndpoint(endpoint);
    }
    setExpandedEndpoints(newExpanded);
  };

  const isExpanded = (endpoint: MockEndpoint) => {
    const key = `${endpoint.method}-${endpoint.path}`;
    return expandedEndpoints.has(key);
  };

  if (mockApis.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--docs-text)" }}>
          <h2>No APIs Available</h2>
          <p>Mock API data not loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerSectionStyle}>
        <div>
          <h1 style={titleStyle}>API Documentation</h1>
          <p style={subtitleStyle}>
            Explore {mockApis.length} endpoints across {allTags.length} categories. 
            Interactive documentation with code examples and live testing.
          </p>
        </div>
        <div style={statsStyle}>
          <div style={statItemStyle}>
            <div style={statNumberStyle}>{mockApis.length}</div>
            <div style={statLabelStyle}>Endpoints</div>
          </div>
          <div style={statItemStyle}>
            <div style={statNumberStyle}>{allTags.length}</div>
            <div style={statLabelStyle}>Categories</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={filterBarStyle}>
        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder="Search endpoints by path, method, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
            className="theme-surface"
          />
        </div>
        <div style={tagFilterStyle}>
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              ...tagButtonStyle,
              ...(selectedTag === null ? tagButtonActiveStyle : {})
            }}
            className={selectedTag === null ? "theme-button active" : "theme-button"}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                ...tagButtonStyle,
                ...(selectedTag === tag ? tagButtonActiveStyle : {})
              }}
              className={selectedTag === tag ? "theme-button active" : "theme-button"}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {filteredApis.length !== mockApis.length && (
        <div style={resultsCountStyle}>
          Showing {filteredApis.length} of {mockApis.length} endpoints
        </div>
      )}

      {/* API Groups */}
      <div style={contentStyle}>
        {Object.entries(groupedApis).map(([tag, apis]) => (
          <section key={tag} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <span style={tagBadgeStyle}>{tag}</span>
              <span style={tagCountStyle}>{apis.length} endpoint{apis.length !== 1 ? 's' : ''}</span>
            </h2>
            
            <div style={endpointsGridStyle}>
              {apis.map((api, idx) => {
                const key = `${api.method}-${api.path}`;
                const expanded = isExpanded(api);
                
                return (
                  <div key={idx} style={endpointWrapperStyle}>
                    {/* Compact Endpoint Card */}
                    <div 
                      style={compactCardStyle}
                      onClick={() => toggleEndpoint(api)}
                      className="theme-surface"
                    >
                      <div style={compactHeaderStyle}>
                        <span style={{
                          ...methodBadgeStyle,
                          background: getMethodColor(api.method)
                        }}>
                          {api.method}
                        </span>
                        <code style={pathTextStyle}>{api.path}</code>
                        <button
                          style={expandButtonStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEndpoint(api);
                          }}
                        >
                          {expanded ? '−' : '+'}
                        </button>
                      </div>
                      <p style={summaryTextStyle}>{api.summary}</p>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div style={expandedSectionStyle}>
                        {/* Full Endpoint Card */}
                        <EndpointCard
                          method={api.method}
                          path={api.path}
                          summary={api.summary}
                          description={api.description}
                          parameters={api.parameters?.map(p => ({
                            name: p.name,
                            in: p.in,
                            required: p.required,
                            description: p.description
                          }))}
                          requestBody={api.requestBody?.schema ? JSON.stringify(api.requestBody.schema, null, 2) : undefined}
                          responses={Object.entries(api.responses).map(([code, resp]) => ({
                            code,
                            description: resp.description
                          }))}
                        />

                        {/* Request Body Schema */}
                        {api.requestBody && (
                          <SchemaViewer
                            name="Request Body"
                            schema={api.requestBody.schema}
                            example={api.requestBody.example}
                          />
                        )}

                        {/* Code Examples */}
                        {api.curlExample && (
                          <CodeSnippet
                            code={api.curlExample}
                            language="bash"
                            title="cURL Example"
                          />
                        )}

                        {api.codeExample && (
                          <CodeSnippet
                            code={api.codeExample}
                            language="javascript"
                            title="JavaScript Example"
                          />
                        )}

                        {/* Response Examples */}
                        {Object.entries(api.responses).map(([code, resp]) => {
                          if (resp.example) {
                            return (
                              <SchemaViewer
                                key={code}
                                name={`Response ${code}`}
                                schema={resp.example as Record<string, unknown>}
                              />
                            );
                          }
                          return null;
                        })}

                        {/* Try It Panel */}
                        <TryItPanel
                          method={api.method}
                          path={api.path}
                          baseUrl="https://api.example.com"
                          requestBody={api.requestBody?.example ? JSON.stringify(api.requestBody.example, null, 2) : undefined}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredApis.length === 0 && (
          <div style={emptyStateStyle}>
            <p style={emptyStateTextStyle}>No endpoints found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
              }}
              style={clearButtonStyle}
              className="theme-button"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    PATCH: "#8b5cf6",
    DELETE: "#ef4444",
  };
  return colors[method.toUpperCase()] || "var(--docs-accent)";
}

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "2rem 1.5rem",
  minHeight: "100vh",
  width: "100%",
};

const headerSectionStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "2.5rem",
  gap: "2rem",
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  fontWeight: 700,
  margin: 0,
  marginBottom: "0.5rem",
  background: "linear-gradient(135deg, var(--docs-accent) 0%, var(--docs-text) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  color: "var(--docs-text-muted)",
  margin: 0,
  lineHeight: 1.6,
  maxWidth: "600px",
};

const statsStyle: React.CSSProperties = {
  display: "flex",
  gap: "2rem",
};

const statItemStyle: React.CSSProperties = {
  textAlign: "center",
};

const statNumberStyle: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: 700,
  color: "var(--docs-accent)",
  lineHeight: 1,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--docs-text-muted)",
  marginTop: "0.25rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const filterBarStyle: React.CSSProperties = {
  marginBottom: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const searchContainerStyle: React.CSSProperties = {
  width: "100%",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.875rem 1.25rem",
  fontSize: "1rem",
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  background: "var(--docs-surface)",
  color: "var(--docs-text)",
  transition: "all 0.2s ease",
};

const tagFilterStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const tagButtonStyle: React.CSSProperties = {
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

const tagButtonActiveStyle: React.CSSProperties = {
  background: "var(--docs-accent-soft)",
  borderColor: "var(--docs-accent)",
  color: "var(--docs-accent)",
};

const resultsCountStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--docs-text-muted)",
  marginBottom: "1.5rem",
  padding: "0.5rem 0",
};

const contentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "3rem",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const sectionTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  fontSize: "1.5rem",
  fontWeight: 600,
  margin: 0,
  paddingBottom: "0.75rem",
  borderBottom: "2px solid var(--docs-border)",
};

const tagBadgeStyle: React.CSSProperties = {
  padding: "0.375rem 0.875rem",
  borderRadius: "var(--docs-radius)",
  background: "var(--docs-accent-soft)",
  color: "var(--docs-accent)",
  fontSize: "0.875rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tagCountStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--docs-text-muted)",
  fontWeight: 400,
  marginLeft: "auto",
};

const endpointsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100%, 1fr))",
  gap: "1rem",
};

const endpointWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const compactCardStyle: React.CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  background: "var(--docs-surface)",
};

const compactHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  marginBottom: "0.5rem",
};

const methodBadgeStyle: React.CSSProperties = {
  padding: "0.25rem 0.625rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#fff",
  minWidth: "60px",
  textAlign: "center",
};

const pathTextStyle: React.CSSProperties = {
  fontFamily: "var(--docs-font-mono)",
  fontSize: "0.9375rem",
  color: "var(--docs-accent)",
  flex: 1,
};

const expandButtonStyle: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "4px",
  border: "1px solid var(--docs-border)",
  background: "var(--docs-surface-hover)",
  color: "var(--docs-text)",
  fontSize: "1.25rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const summaryTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.9375rem",
  color: "var(--docs-text-muted)",
  lineHeight: 1.5,
};

const expandedSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  padding: "1.5rem",
  borderRadius: "var(--docs-radius)",
  background: "var(--docs-surface-hover)",
  border: "1px solid var(--docs-border)",
  marginTop: "0.5rem",
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "4rem 2rem",
  color: "var(--docs-text-muted)",
};

const emptyStateTextStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  marginBottom: "1.5rem",
};

const clearButtonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};
