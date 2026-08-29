import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import PostCard from "../components/PostCard";
import { CATEGORIES, categoryColor } from "../lib/categories";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      const response = await client.get("/posts", { params });
      setPosts(response.data);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const tabs = ["All", ...CATEGORIES];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Campus Feed</h2>
        <p className="page-subtext">
          Real questions and answers from students on your campus.
        </p>
      </div>

      {/* Category Filter */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {tabs.map((cat) => {
          const active = category === cat || (cat === "All" && category === "");
          const color = cat === "All" ? "var(--ink)" : categoryColor(cat);
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? "" : cat)}
              style={{
                padding: "7px 15px",
                fontSize: 13.5,
                fontWeight: 600,
                borderRadius: 999,
                border: `1.5px solid ${active ? color : "var(--border)"}`,
                background: active ? color : "var(--surface)",
                color: active ? "#fff" : "var(--ink-soft)",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Posts List */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "var(--ink-soft)",
          }}
        >
          Loading posts…
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
            No posts yet
          </p>
          <p style={{ fontSize: 14 }}>
            Be the first to share something with your campus.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => navigate(`/posts/${post.id}`)}
        />
      ))}
    </div>
  );
}
