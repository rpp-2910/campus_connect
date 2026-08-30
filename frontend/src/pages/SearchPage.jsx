import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = searchParams.get("q");

  const bestSimilarity = results.length > 0 ? Number(results[0].similarity) : 0;

  const hasStrongMatch = bestSimilarity >= 0.75;

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);

        const response = await client.post("/search", {
          query: query,
        });

        setResults(response.data.results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 20px",
      }}
    >
      <h2>Search results for "{query}"</h2>

      {!loading && results.length > 0 && !hasStrongMatch && (
        <p
          style={{
            padding: "12px 14px",
            background: "#f7f4ea",
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          No exact match found. Showing related campus discussions instead.
        </p>
      )}

      {loading && <p>Searching...</p>}

      {!loading && results.length === 0 && <p>No matching posts found.</p>}

      {results.map((post) => {
        const similarity = Number(post.similarity);

        let relevance = "Related";
        if (similarity >= 0.75) relevance = "Highly relevant";
        else if (similarity >= 0.68) relevance = "Relevant";

        return (
          <div
            key={post.post_id}
            onClick={() => navigate(`/posts/${post.post_id}`)}
            style={{
              padding: 18,
              marginTop: 16,
              border: "1px solid #ddd",
              borderRadius: 10,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{post.title}</h3>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 8px",
                  borderRadius: 999,
                  background: "#f3f3f3",
                  whiteSpace: "nowrap",
                }}
              >
                {relevance}
              </span>
            </div>

            <p>{post.content}</p>

            <small>
              {post.username} · Year {post.year} · {post.category}
            </small>
          </div>
        );
      })}
    </div>
  );
}

