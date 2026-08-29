import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function CommentBox({ postId, onCommentAdded }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      const response = await client.post(`/posts/${postId}/comments`, {
        content,
      });
      onCommentAdded(response.data);
      setContent("");
    } catch (err) {
      console.error("Failed to add comment");
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
          Log in to join the discussion.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 10 }}>Add a comment</h4>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share your experience or answer…"
          style={{ marginBottom: 10 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Posting…" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
