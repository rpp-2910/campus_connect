import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import PostCard from "../components/PostCard";
import { CATEGORIES } from "../lib/categories";

const categoryMeta = {
  "Academics & Notes": { icon: "▤", text: "Notes, exams & study resources" },
  "Professors & Courses": { icon: "◉", text: "Courses, reviews & guidance" },
  "Placements & Internships": { icon: "↗", text: "OAs, interviews & careers" },
  "Campus Life": { icon: "⌂", text: "Clubs, events & student life" },
  General: { icon: "✦", text: "Everything else on campus" },
};

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
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
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main className="feed-page-shell">
      <section className="feed-hero">
        <div>
          <span className="eyebrow">STUDENT COMMUNITY</span>
          <h1>What’s happening on campus?</h1>
          <p>
            Discover notes, professor reviews, placement experiences and advice
            shared by students who have already been there.
          </p>
        </div>
        <div className="feed-hero-actions">
          <Link to="/assistant" className="hero-secondary-button">
            ✦ Ask Campus AI
          </Link>
          <Link to="/create" className="hero-primary-button">
            ＋ Create a post
          </Link>
        </div>
      </section>

      <section className="feed-filter-card">
        <div className="feed-filter-label">Explore by category</div>
        <div className="category-tabs">
          {tabs.map((cat) => {
            const active =
              category === cat || (cat === "All" && category === "");
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
        <section className="feed-main-column">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">DISCUSSIONS</span>
              <h2>{category || "Campus Feed"}</h2>
            </div>
            {!loading && (
              <span className="discussion-count">{posts.length} posts</span>
            )}
          </div>

          {loading && (
            <div className="feed-status">Loading campus discussions…</div>
          )}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && posts.length === 0 && (
            <div className="feed-empty-state">
              <div className="empty-icon">▱</div>
              <h3>No posts here yet</h3>
              <p>
                Start the conversation by sharing something useful with your
                campus.
              </p>
              <Link to="/create" className="hero-primary-button">
                Create first post
              </Link>
            </div>
          )}

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
        </section>

        <aside className="feed-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-heading">
              <span className="section-kicker">BROWSE</span>
              <h3>Popular categories</h3>
            </div>
            <div className="sidebar-category-list">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}>
                  <span className="sidebar-category-icon">
                    {categoryMeta[cat].icon}
                  </span>
                  <span className="sidebar-category-copy">
                    <strong>{cat}</strong>
                    <small>{categoryMeta[cat].text}</small>
                  </span>
                  <span className="sidebar-arrow">›</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-ai-card">
            <span className="ai-spark">✦</span>
            <h3>Can’t find the answer?</h3>
            <p>
              Ask Campus AI. It searches student discussions and answers from
              real campus knowledge.
            </p>
            <Link to="/assistant">Ask a question →</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
