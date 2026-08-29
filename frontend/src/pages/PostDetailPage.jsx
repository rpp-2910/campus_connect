import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import VoteButtons from "../components/VoteButtons";
import CommentBox from "../components/CommentBox";
import { categoryColor, initials } from "../lib/categories";

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      const response = await client.get(`/posts/${id}`);
      setPost(response.data);
      setComments(response.data.comments);
    } catch {
      console.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCommentAdded = (newComment) => {
    setComments((prev) => [...prev, newComment]);
  };

  if (loading)
    return (
      <div className="page" style={{ color: "var(--ink-soft)" }}>
        Loading…
      </div>
    );
  if (!post)
    return (
      <div className="page" style={{ color: "var(--ink-soft)" }}>
        Post not found
      </div>
    );

  const color = categoryColor(post.category);

  return (
    <div className="page">
      {/* Post */}
      <div
        className="card tab-card"
        style={{
          "--tab-color": color,
          padding: "24px 24px 24px 28px",
          marginBottom: 28,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            className="badge"
            style={{
              "--tab-color": color,
              "--tab-color-bg": "transparent",
              border: `1px solid ${color}`,
            }}
          >
            {post.category}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="avatar"
              style={{ width: 24, height: 24, fontSize: 11 }}
            >
              {initials(post.username)}
            </span>
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {post.username} · Year {post.year}
            </span>
          </div>
        </div>

        <h2 style={{ marginBottom: 10 }}>{post.title}</h2>
        <p
          style={{
            lineHeight: 1.7,
            color: "var(--ink)",
            marginBottom: 16,
            fontSize: 15,
          }}
        >
          {post.content}
        </p>

        <VoteButtons postId={post.id} initialCount={post.vote_count || 0} />
      </div>

      {/* Comments */}
      <h3 style={{ marginBottom: 12 }}>Comments ({comments.length})</h3>

      {comments.length === 0 && (
        <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>
          No comments yet. Be the first!
        </p>
      )}

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="card"
          style={{ padding: 14, marginBottom: 10, textAlign: "left" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              className="avatar"
              style={{ width: 22, height: 22, fontSize: 10.5 }}
            >
              {initials(comment.username)}
            </span>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>
              {comment.username}
            </span>
            <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
              · {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            {comment.content}
          </p>
        </div>
      ))}

      {/* Add Comment */}
      <CommentBox postId={id} onCommentAdded={handleCommentAdded} />
    </div>
  );
}
