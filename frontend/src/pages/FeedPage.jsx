import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import PostCard from "../components/PostCard";
import { CATEGORIES } from "../lib/categories";

const PAGE_SIZE = 6;

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "upvoted", "discussed"
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (category) params.category = category;
      const response = await client.get("/posts", { params });
      setPosts(response.data);
      setVisibleCount(PAGE_SIZE);
    } catch {
      setError("Failed to load campus discussions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    if (sortBy === "upvoted") {
      return list.sort((a, b) => Number(b.vote_count || 0) - Number(a.vote_count || 0));
    }
    if (sortBy === "discussed") {
      return list.sort((a, b) => Number(b.comment_count || 0) - Number(a.comment_count || 0));
    }
    // Default: newest
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [posts, sortBy]);

  const tabs = ["All", ...CATEGORIES];
  const displayedPosts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPosts.length;

  const featuredPost = displayedPosts[0];
  const remainingPosts = displayedPosts.slice(1);

  return (
    <main className="feed-page-shell">
      {/* Hero Header */}
      <section className="feed-hero">
        <div>
          <span className="eyebrow">STUDENT COMMUNITY</span>
          <h1>What’s happening on campus?</h1>
          <p>
            Discover notes, professor reviews, placement experiences and advice
            shared by students who have already been through it.
          </p>
        </div>
      </section>

      {/* Category Pills */}
      <section className="feed-filter-card">
        <div className="feed-filter-label">Explore by category</div>
        <div className="category-tabs">
          {tabs.map((cat) => {
            const active = category === cat || (cat === "All" && category === "");
            return (
              <button
                key={cat}
                className={active ? "category-tab active" : "category-tab"}
                onClick={() => setCategory(cat === "All" ? "" : cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      <div className="feed-layout">
        {/* Main Feed Column */}
        <section className="feed-main-column">
          <div className="feed-toolbar">
            <div className="section-heading-row" style={{ margin: 0 }}>
              <div>
                <span className="section-kicker">DISCUSSIONS</span>
                <h2>{category || "Campus Feed"}</h2>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!loading && (
                <span className="discussion-count">{posts.length} discussions</span>
              )}
              <select
                className="feed-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort discussions by"
              >
                <option value="newest">Newest First</option>
                <option value="upvoted">Most Upvoted</option>
                <option value="discussed">Most Discussed</option>
              </select>
            </div>
          </div>

          {/* Skeleton Loaders */}
          {loading && (
            <div>
              {[1, 2, 3].map((n) => (
                <div key={n} className="card-skeleton">
                  <div className="skeleton" style={{ width: "25%", height: 16, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: "70%", height: 22, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: "95%", height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 16 }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="skeleton" style={{ width: "30%", height: 24 }} />
                    <div className="skeleton" style={{ width: "20%", height: 24 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="feed-empty-state">
              <div className="empty-icon">▱</div>
              <h3>No posts in {category || "this category"} yet</h3>
              <p>
                Start the conversation by sharing something useful with your campus community.
              </p>
              <Link to="/create" className="hero-primary-button" style={{ marginTop: 8 }}>
                Create first post
              </Link>
            </div>
          )}

          {/* Featured Top Discussion */}
          {!loading && !error && featuredPost && (
            <>
              <div className="featured-label">Featured discussion</div>
              <PostCard
                post={featuredPost}
                featured
                onClick={() => navigate(`/posts/${featuredPost.id}`)}
              />
            </>
          )}

          {/* Remaining Posts */}
          {remainingPosts.length > 0 && (
            <div className="post-list-heading">More from your campus</div>
          )}

          {remainingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => navigate(`/posts/${post.id}`)}
            />
          ))}

          {/* Pagination / Load More Button */}
          {!loading && hasMore && (
            <div className="load-more-box">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="btn btn-load-more"
              >
                Load more discussions ({sortedPosts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="feed-sidebar">
          <div className="sidebar-ai-card">
            <span className="ai-spark">✦</span>
            <h3>Can’t find the answer?</h3>
            <p>
              Ask Campus AI. It searches student discussions and synthesizes answers from verified campus experiences.
            </p>
            <Link to="/assistant">Ask a question →</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
