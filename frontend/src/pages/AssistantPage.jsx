import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { categoryColor } from "../lib/categories";

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await client.post("/ask", { question });
      setResult(response.data);
    } catch {
      setResult({ error: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <span
          className="badge"
          style={{
            "--tab-color": "var(--gold-dark)",
            "--tab-color-bg": "var(--gold-bg)",
            marginBottom: 8,
          }}
        >
          ✦ AI Assistant
        </span>
        <h2>Ask your campus anything</h2>
        <p className="page-subtext">
          Answers are drawn from real posts by students who've been through it —
          placements, professors, courses, campus life.
        </p>
      </div>

      <form onSubmit={handleAsk} style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I prepare for TCS placement?"
            style={{ flex: 1, padding: "12px 14px", fontSize: 15 }}
          />
          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading}
            style={{ padding: "0 22px" }}
          >
            {loading ? "Asking…" : "Ask"}
          </button>
        </div>
      </form>

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "var(--ink-soft)",
            fontSize: 14,
          }}
        >
          Reading through posts from your campus…
        </div>
      )}

      {result && (
        <div>
          {result.error && <p className="error-text">{result.error}</p>}

          {result.no_results && (
            <div
              className="card"
              style={{
                padding: 18,
                marginBottom: 20,
                borderLeft: "4px solid var(--gold)",
                textAlign: "left",
              }}
            >
              <p style={{ lineHeight: 1.6 }}>{result.answer}</p>
              <button
                onClick={() => navigate("/create")}
                className="btn btn-primary"
                style={{ marginTop: 12 }}
              >
                Post this question
              </button>
            </div>
          )}

          {result.answer && !result.no_results && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ marginBottom: 10 }}>Answer</h3>
              <div
                className="card"
                style={{
                  padding: 18,
                  lineHeight: 1.7,
                  fontSize: 15,
                  borderLeft: "4px solid var(--green)",
                  textAlign: "left",
                }}
              >
                {result.answer}
              </div>
            </div>
          )}

          {result.sources && result.sources.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 10 }}>Sources</h3>
              {result.sources.map((source, i) => {
                const color = categoryColor(source.category);
                return (
                  <div
                    key={source.post_id}
                    onClick={() => navigate(`/posts/${source.post_id}`)}
                    className="card tab-card"
                    style={{
                      "--tab-color": color,
                      padding: "12px 14px 12px 18px",
                      marginBottom: 8,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <span
                        className="muted"
                        style={{ fontSize: 12.5, fontWeight: 600 }}
                      >
                        Source {i + 1}
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14.5,
                          marginTop: 2,
                        }}
                      >
                        {source.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--ink-soft)",
                          marginTop: 3,
                        }}
                      >
                        by {source.username} · Year {source.year} ·{" "}
                        {source.category}
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        "--tab-color": "var(--gold-dark)",
                        "--tab-color-bg": "var(--gold-bg)",
                        flexShrink: 0,
                      }}
                    >
                      {(source.relevance_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
