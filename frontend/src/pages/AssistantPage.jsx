import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import client from "../api/client";
import { categoryColor } from "../lib/categories";
import { useToast } from "../context/ToastContext";

const STARTER_PROMPTS = [
  "How do I prepare for TCS NQT placement?",
  "Who is the best faculty for Data Structures?",
  "What is the college attendance policy in 3rd year?",
  "Honest review of campus life, clubs, and hostels",
];

export default function AssistantPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [question, setQuestion] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleAsk = async (e, customQuestion) => {
    if (e) e.preventDefault();
    const queryText = (customQuestion !== undefined ? customQuestion : question).trim();
    if (!queryText) return;

    if (customQuestion !== undefined) {
      setQuestion(customQuestion);
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await client.post("/ask", { question: queryText });
      setResult(response.data);
    } catch (err) {
      console.error("Assistant query error:", err);
      setResult({ error: "Something went wrong while consulting campus knowledge. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleAsk(null, initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleCopyAnswer = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      {/* Page Header */}
      <div className="page-header" style={{ textAlign: "center", marginBottom: 28 }}>
        <span
          className="badge"
          style={{
            "--tab-color": "var(--gold-dark)",
            "--tab-color-bg": "var(--gold-bg)",
            marginBottom: 10,
            fontSize: 12,
            padding: "4px 12px",
          }}
        >
          ✦ Campus AI Assistant
        </span>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Ask your campus anything</h1>
        <p className="page-subtext" style={{ maxWidth: 580, margin: "0 auto" }}>
          Answers are synthesized strictly from real posts written by seniors who have been through it —
          placements, professors, courses, and campus rules.
        </p>
      </div>

      {/* Suggested Starter Prompts */}
      {!result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--ink-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
              textAlign: "left",
            }}
          >
            Popular student questions:
          </div>
          <div className="starter-prompts">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAsk(null, prompt)}
                className="starter-prompt-btn"
                type="button"
              >
                ✦ {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Form */}
      <form onSubmit={(e) => handleAsk(e)} style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I prepare for TCS NQT? or Which electives to take?"
            style={{ flex: 1, padding: "12px 16px", fontSize: 15 }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading || !question.trim()}
            style={{ padding: "0 24px" }}
          >
            {loading ? "Asking…" : "Ask AI"}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "44px 20px",
            color: "var(--ink-soft)",
            marginBottom: 28,
            border: "1.5px dashed var(--border)",
          }}
        >
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Reading through campus discussions…</h3>
          <p style={{ fontSize: 13.5, maxWidth: 420, margin: "0 auto" }}>
            Searching student posts with vector similarity and filtering for verified community knowledge.
          </p>
        </div>
      )}

      {/* Results Container */}
      {result && (
        <div>
          {result.error && (
            <div className="error-text" style={{ textAlign: "left" }}>
              {result.error}
            </div>
          )}

          {/* Insufficient Evidence Empty State */}
          {result.no_results && (
            <div
              className="card"
              style={{
                padding: 24,
                marginBottom: 24,
                borderLeft: "5px solid var(--gold)",
                textAlign: "left",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <strong style={{ fontSize: 15, color: "var(--ink)" }}>No discussion found yet</strong>
              </div>
              <p style={{ lineHeight: 1.65, color: "var(--ink-soft)", fontSize: 14.5 }}>
                {result.answer}
              </p>
              <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                <button
                  onClick={() => navigate(`/create?title=${encodeURIComponent(question)}`)}
                  className="btn btn-primary"
                >
                  ＋ Post this question to community
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setQuestion("");
                  }}
                  className="btn btn-ghost"
                >
                  Ask another question
                </button>
              </div>
            </div>
          )}

          {/* Grounded Answer Card */}
          {result.answer && !result.no_results && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="badge"
                    style={{
                      "--tab-color": "var(--green)",
                      "--tab-color-bg": "var(--green-bg)",
                    }}
                  >
                    ✦ Senior Student Synthesis
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                    Grounded in campus posts
                  </span>
                </div>

                <button
                  onClick={handleCopyAnswer}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 12.5,
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>

              <div className="ai-answer-card">
                <p style={{ lineHeight: 1.75, fontSize: 15.5, whiteSpace: "pre-wrap", color: "var(--ink)" }}>
                  {result.answer}
                </p>
              </div>
            </div>
          )}

          {/* Grounding Sources */}
          {result.sources && result.sources.length > 0 && (
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>
                  Grounding Sources ({result.sources.length})
                </h3>
                <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                  Real student posts cited in answer
                </span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {result.sources.map((source, i) => {
                  const catColor = categoryColor(source.category);
                  const relScore = Number(source.relevance_score || 0);

                  // Qualitative relevance badges (never a fabricated % match)
                  let relTier = "Related";
                  let relClass = "relevance-low";
                  if (relScore >= 0.76) {
                    relTier = "High Relevance";
                    relClass = "relevance-high";
                  } else if (relScore >= 0.67) {
                    relTier = "Relevant";
                    relClass = "relevance-medium";
                  }

                  return (
                    <article
                      key={source.post_id || i}
                      onClick={() => navigate(`/posts/${source.post_id}`)}
                      className="source-item-card"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            className="badge"
                            style={{
                              "--tab-color": catColor,
                              "--tab-color-bg": "transparent",
                              border: `1px solid ${catColor}`,
                            }}
                          >
                            {source.category}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                            Source {i + 1} · by {source.username} (Year {source.year})
                          </span>
                        </div>

                        <span className={`relevance-badge ${relClass}`}>
                          {relTier}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>
                        {source.title}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 12, color: "var(--gold-dark)", fontWeight: 600 }}>
                          Read full discussion →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
