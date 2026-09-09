import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import { CATEGORIES, categoryColor } from "../lib/categories";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("relevance"); // "relevance", "newest", "upvoted"

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!queryParam.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await client.post("/search", {
          query: queryParam.trim(),
        });

        setResults(response.data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to execute search. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [queryParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim() });
  };

  // Filter and sort the retrieved candidate results
  const filteredResults = useMemo(() => {
    let list = [...results];

    if (selectedCategory) {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (selectedYear) {
      list = list.filter((item) => String(item.year) === String(selectedYear));
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "upvoted") {
      list.sort((a, b) => Number(b.vote_weight || 0) - Number(a.vote_weight || 0));
    }
    // "relevance" preserves backend semantic ranking order

    return list;
  }, [results, selectedCategory, selectedYear, sortBy]);

  const hasStrongMatch = results.some((r) => Number(r.similarity) >= 0.72);

  return (
    <div className="page page-wide" style={{ paddingBottom: 80 }}>
      <div className="page-header">
        <span className="eyebrow">SEMANTIC SEARCH</span>
        <h1>Search Campus Knowledge</h1>
        <p className="page-subtext">
          Search across student discussions, placement questions, course reviews, and exam notes by meaning.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-faint)",
              fontSize: 16,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for anything (e.g. TCS interview, DBMS notes, best electives)…"
            style={{ paddingLeft: 42, height: 46, fontSize: 15 }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: "0 24px" }} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Multi-Filter Toolbar */}
      {results.length > 0 && (
        <div className="search-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
              Filter By:
            </span>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Filter by student year"
            >
              <option value="">All Student Years</option>
              <option value="1">1st Year Authors</option>
              <option value="2">2nd Year Authors</option>
              <option value="3">3rd Year Authors</option>
              <option value="4">4th Year Authors</option>
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort search results"
            >
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest First</option>
              <option value="upvoted">Highest Voted</option>
            </select>
          </div>
        </div>
      )}

      {/* Related Results Notice */}
      {!loading && results.length > 0 && !hasStrongMatch && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.2)",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13.5,
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✦</span>
          <span>No exact keyword match found. Showing related campus discussions based on semantic meaning.</span>
        </div>
      )}

      {/* Skeletons Loading */}
      {loading && (
        <div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card-skeleton">
              <div className="skeleton" style={{ width: "30%", height: 16, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: "65%", height: 22, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: "90%", height: 14, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: "40%", height: 14 }} />
            </div>
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {/* Empty State: No query entered */}
      {!loading && !queryParam && (
        <div className="empty-state" style={{ marginTop: 24, padding: "54px 20px" }}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <h3 style={{ marginTop: 12, marginBottom: 6 }}>Search campus discussions</h3>
          <p style={{ maxWidth: 460, margin: "0 auto", fontSize: 14 }}>
            Type a question, topic, or keyword above. Semantic search will find relevant discussions even if phrased differently.
          </p>
        </div>
      )}

      {/* Empty State: No results found */}
      {!loading && queryParam && results.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24, padding: "54px 20px" }}>
          <span style={{ fontSize: 32 }}>💬</span>
          <h3 style={{ marginTop: 12, marginBottom: 6 }}>No discussions found for "{queryParam}"</h3>
          <p style={{ maxWidth: 460, margin: "0 auto 20px", fontSize: 14 }}>
            Nobody has posted about this exact topic yet. You can ask Campus AI to synthesize related knowledge or post this question to the community.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Link to={`/assistant?q=${encodeURIComponent(queryParam)}`} className="btn btn-accent">
              ✦ Ask Campus AI
            </Link>
            <Link to={`/create?title=${encodeURIComponent(queryParam)}`} className="btn btn-primary">
              ＋ Post this question
            </Link>
          </div>
        </div>
      )}

      {/* Results List */}
      {!loading && filteredResults.map((post) => {
        const similarity = Number(post.similarity || 0);

        // Qualitative relevance tiers (NO literal % score!)
        let relevanceLabel = "Related";
        let relevanceClass = "relevance-low";

        if (similarity >= 0.74) {
          relevanceLabel = "High Relevance";
          relevanceClass = "relevance-high";
        } else if (similarity >= 0.67) {
          relevanceLabel = "Relevant";
          relevanceClass = "relevance-medium";
        }

        const catColor = categoryColor(post.category);

        return (
          <article
            key={post.post_id}
            onClick={() => navigate(`/posts/${post.post_id}`)}
            className="card tab-card"
            style={{
              "--tab-color": catColor,
              padding: "20px 22px 18px 24px",
              marginBottom: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    className="badge"
                    style={{
                      "--tab-color": catColor,
                      "--tab-color-bg": "transparent",
                      border: `1px solid ${catColor}`,
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    by {post.username} · Year {post.year || 1}
                  </span>
                </div>

                <h3 style={{ margin: "4px 0 8px", fontSize: 17.5, color: "var(--ink)" }}>
                  {post.title}
                </h3>
              </div>

              {/* Qualitative Relevance Label */}
              <span className={`relevance-badge ${relevanceClass}`}>
                {relevanceLabel}
              </span>
            </div>

            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
              {post.content.length > 220 ? post.content.substring(0, 220) + "…" : post.content}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
              </span>
              <span style={{ fontSize: 13, color: "var(--gold-dark)", fontWeight: 600 }}>
                View discussion →
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
