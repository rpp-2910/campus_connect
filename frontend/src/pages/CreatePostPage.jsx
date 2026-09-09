import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import client from "../api/client";
import { CATEGORIES, categoryColor } from "../lib/categories";
import { useToast } from "../context/ToastContext";

export default function CreatePostPage() {
  const [searchParams] = useSearchParams();
  const initialTitle = searchParams.get("title") || "";
  const initialCategory = searchParams.get("category") || "General";

  const [formData, setFormData] = useState({
    title: initialTitle,
    content: "",
    category: initialCategory,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (initialTitle && !formData.title) {
      setFormData((prev) => ({ ...prev, title: initialTitle }));
    }
  }, [initialTitle]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await client.post("/posts", formData);
      toast.success("Post created successfully!");
      navigate(`/posts/${response.data.id}`);
    } catch (err) {
      console.error("Create post error:", err);
      const msg = err.response?.data?.error || "Failed to create post";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <span className="eyebrow">CONTRIBUTE KNOWLEDGE</span>
        <h1>Create a Discussion</h1>
        <p className="page-subtext">
          Share your placement experience, professor reviews, study notes, or questions for your campus community.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ padding: 28, textAlign: "left", marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. How I cleared TCS NQT technical round in 3 weeks"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
              style={{
                borderLeft: `4px solid ${categoryColor(formData.category)}`,
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Detailed Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              placeholder="Share the full details, tips, questions, or resources. Formatting with clear paragraphs makes it easy for juniors to read…"
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {formData.content.length} characters
            </span>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Publishing…" : "Publish Post"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Community Posting Guidelines */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          background: "rgba(255, 255, 255, 0.7)",
          border: "1px dashed var(--border)",
          textAlign: "left",
          fontSize: 13,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--ink)" }}>💡 Senior Student Tip:</strong> Posts with specific company interview questions, professor attendance policies, and course feedback are automatically indexed by the Campus AI to help other students!
      </div>
    </div>
  );
}
