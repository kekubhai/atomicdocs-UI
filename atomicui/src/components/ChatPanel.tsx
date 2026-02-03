"use client";

import { useTamboV1, useTamboV1ThreadInput, useTamboV1Suggestions } from "@tambo-ai/react/v1";

function SuggestionsStrip() {
  const { suggestions, accept, isPending } = useTamboV1Suggestions({ maxSuggestions: 4 });

  if (!suggestions?.length) return null;

  return (
    <div style={suggestionsWrapStyle}>
      <span className="theme-muted" style={suggestionsLabelStyle}>
        Suggested
      </span>
      <div style={suggestionsChipsStyle}>
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            className="theme-suggestion-chip"
            onClick={() => accept({ suggestion: s, shouldSubmit: true })}
            disabled={isPending}
            style={suggestionChipStyle}
          >
            {s.title || s.detailedSuggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageList() {
  const { threadId, setThreadId } = useTamboV1ThreadInput();
  const { messages, currentThreadId, isStreaming, startNewThread } = useTamboV1(threadId);

  const activeId = threadId ?? currentThreadId;
  const threadMessages = activeId ? messages : [];

  return (
    <div style={messagesWrapStyle}>
      {threadMessages.length === 0 && (
        <div className="theme-muted" style={emptyStyle}>
          Ask about your API: “How do I create a user?”, “Show me curl for POST /users”, “List endpoints”, “Explain authentication”
        </div>
      )}
      {threadMessages.map((msg) => (
        <div
          key={msg.id}
          className={msg.role === "user" ? "theme-surface" : ""}
          style={{
            ...messageStyle,
            ...(msg.role === "user" ? userMessageStyle : {}),
          }}
        >
          <span style={roleStyle}>{msg.role === "user" ? "You" : "Docs"}</span>
          <div style={contentStyle}>
            {msg.content?.map((block: { type?: string; text?: string; renderedComponent?: React.ReactNode }, i: number) => {
              if (block.type === "text" && "text" in block && block.text) {
                return (
                  <p key={i} style={textStyle}>
                    {block.text}
                  </p>
                );
              }
              if ("renderedComponent" in block && block.renderedComponent) {
                return <div key={i}>{block.renderedComponent}</div>;
              }
              return null;
            })}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="theme-muted" style={streamingStyle}>
          …
        </div>
      )}
      {threadMessages.length > 0 && (
        <button
          type="button"
          className="theme-button theme-muted"
          onClick={() => {
            startNewThread();
            setThreadId(undefined);
          }}
          style={newThreadStyle}
        >
          New thread
        </button>
      )}
    </div>
  );
}

function ChatInput() {
  const { value, setValue, submit, isPending, setThreadId } = useTamboV1ThreadInput();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isPending) return;
    const result = await submit();
    if (result?.threadId) setThreadId(result.threadId);
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        type="text"
        className="theme-surface"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask about your API…"
        disabled={isPending}
        style={inputStyle}
      />
      <button
        type="submit"
        className="theme-button theme-accent"
        disabled={isPending || !value.trim()}
        style={submitStyle}
      >
        {isPending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

export function ChatPanel() {
  return (
    <div style={panelStyle}>
      <MessageList />
      <SuggestionsStrip />
      <ChatInput />
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
};

const messagesWrapStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const emptyStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  textAlign: "center",
  padding: "2rem 1rem",
  lineHeight: 1.6,
};

const messageStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--docs-radius)",
  border: "1px solid var(--docs-border)",
  boxShadow: "var(--docs-shadow)",
};

const userMessageStyle: React.CSSProperties = {
  alignSelf: "flex-end",
  maxWidth: "85%",
};

const roleStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginBottom: "0.25rem",
  color: "var(--docs-text-muted)",
};

const contentStyle: React.CSSProperties = {
  fontSize: "0.9375rem",
  lineHeight: 1.5,
};

const textStyle: React.CSSProperties = {
  margin: "0 0 0.5rem",
};

const streamingStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
};

const newThreadStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.375rem 0.75rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
  border: "1px solid var(--docs-border)",
  borderRadius: "var(--docs-radius)",
  background: "var(--docs-surface)",
  color: "var(--docs-text-muted)",
};

const suggestionsWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  padding: "0 1rem 0.75rem",
  borderTop: "1px solid var(--docs-border)",
  background: "var(--docs-surface)",
};

const suggestionsLabelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const suggestionsChipsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const suggestionChipStyle: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
  transition: "border-color 0.15s, color 0.15s, background 0.15s",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  padding: "1rem",
  borderTop: "1px solid var(--docs-border)",
  background: "var(--docs-surface)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.9375rem",
};

const submitStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  borderRadius: "var(--docs-radius)",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid var(--docs-accent)",
  background: "var(--docs-accent-soft)",
  color: "var(--docs-accent)",
  boxShadow: "var(--docs-shadow)",
};
