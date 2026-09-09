import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import client from "../api/client";

export default function CommentBox({ postId, onCommentAdded }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await client.post(`/posts/${postId}/comments`, {
        content: content.trim(),
      });
      onCommentAdded(response.data);
      setContent("");
      toast.success("Comment posted");
    } catch (err) {
      console.error("Failed to add comment:", err);
      const msg = err.response?.data?.error || "Failed to add comment";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div
        className="card"
        style={{ padding: 16, textAlign: "center", marginTop: 20 }}
      >
        <p className="muted" style={{ fontSize: 14 }}>
          Log in to join the discussion and post a comment.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 10 }}>Add a comment</h4>
      {error && <p className="error-text" style={{ marginBottom: 8 }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share your experience or answer…"
          style={{ marginBottom: 10 }}
          disabled={loading}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !content.trim()}>
          {loading ? "Posting…" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
