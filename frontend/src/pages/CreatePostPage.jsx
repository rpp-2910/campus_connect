import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { CATEGORIES } from "../lib/categories";

export default function CreatePostPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await client.post("/posts", formData);
      navigate(`/posts/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 620 }}>
      <div className="page-header">
        <h2>Create a post</h2>
        <p className="page-subtext">
          Share notes, ask a question, or post an update for your campus.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ padding: 24, textAlign: "left" }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="What's this about?"
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={7}
              placeholder="Share the details…"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Posting…" : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
