import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import VoteButtons from "../components/VoteButtons";
import CommentBox from "../components/CommentBox";
import { categoryColor, initials } from "../lib/categories";
import FileAttachments from "../components/FileAttachments";
import ConfirmModal from "../components/ConfirmModal";
import EditPostModal from "../components/EditPostModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeletePostOpen, setIsDeletePostOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/posts/${id}`);
      setPost(response.data);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Failed to load post:", err);
      toast.error("Failed to load post");
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

  const handlePostUpdated = (updatedPost) => {
    setPost((prev) => ({
      ...prev,
      ...updatedPost,
    }));
  };

  const handleDeletePost = async () => {
    setDeletingPost(true);
    try {
      await client.delete(`/posts/${id}`);
      toast.success("Post deleted successfully");
      navigate("/");
    } catch (err) {
      console.error("Delete post error:", err);
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || "Failed to delete post";
      if (code === "S3_DELETE_PERMISSION_DENIED") {
        toast.error("AWS S3 Permission Error: 's3:DeleteObject' is missing from IAM credentials. Post retained.");
      } else {
        toast.error(msg);
      }
    } finally {
      setDeletingPost(false);
      setIsDeletePostOpen(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setDeletingCommentId(commentToDelete.id);

    try {
      await client.delete(`/comments/${commentToDelete.id}`);
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      toast.success("Comment deleted");
      setCommentToDelete(null);
    } catch (err) {
      console.error("Delete comment error:", err);
      toast.error(err.response?.data?.error || "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ color: "var(--ink-soft)", textAlign: "center", paddingTop: 40 }}>
        Loading post…
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page" style={{ color: "var(--ink-soft)", textAlign: "center", paddingTop: 40 }}>
        Post not found
      </div>
    );
  }

  const isPostAuthor = Boolean(user && post.user_id && Number(user.id) === Number(post.user_id));
  const isPostModerator = Boolean(user && (user.role === "moderator" || user.role === "admin"));
  const canDeletePost = isPostAuthor || isPostModerator;
  const canEditPost = isPostAuthor;

  const color = categoryColor(post.category);

  return (
    <div className="page">
      {/* Post Main Card */}
      <div
        className="card tab-card"
        style={{
          "--tab-color": color,
          padding: "24px 24px 24px 28px",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10,
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

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="avatar"
                style={{ width: 24, height: 24, fontSize: 11 }}
              >
                {initials(post.username)}
              </span>
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                {post.username} · Year {post.year}
                {post.branch ? ` · ${post.branch}` : ""}
              </span>
            </div>

            {/* Post Author / Moderator Action Controls */}
            {(canEditPost || canDeletePost) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: "1px solid var(--border-soft)", paddingLeft: 10 }}>
                {canEditPost && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink-soft)",
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "2px 6px",
                      textDecoration: "underline",
                    }}
                  >
                    Edit
                  </button>
                )}

                {canDeletePost && (
                  <button
                    onClick={() => setIsDeletePostOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#c1493d",
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "2px 6px",
                      textDecoration: "underline",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h2 style={{ marginBottom: 12 }}>{post.title}</h2>
        <p
          style={{
            lineHeight: 1.7,
            color: "var(--ink)",
            marginBottom: 20,
            fontSize: 15,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.content}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <VoteButtons
            postId={post.id}
            initialCount={post.vote_count || 0}
            initialUserVote={post.current_user_vote}
          />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            💬 {comments.length} comment{comments.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Attachments Section */}
      <FileAttachments postId={post.id} postAuthorId={post.user_id} />

      {/* Comments Section */}
      <h3 style={{ marginBottom: 14 }}>Comments ({comments.length})</h3>

      {comments.length === 0 && (
        <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
          No comments yet. Be the first to start the conversation!
        </p>
      )}

      {comments.map((comment) => {
        const isCommentAuthor = Boolean(
          user && comment.user_id && Number(user.id) === Number(comment.user_id)
        );
        const canDeleteComment = isCommentAuthor || isPostModerator;

        return (
          <div
            key={comment.id}
            className="card"
            style={{
              padding: 16,
              marginBottom: 12,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

              {canDeleteComment && (
                <button
                  onClick={() => setCommentToDelete(comment)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c1493d",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: "2px 6px",
                    opacity: 0.8,
                  }}
                  title="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {comment.content}
            </p>
          </div>
        );
      })}

      {/* Add Comment Form */}
      <CommentBox postId={id} onCommentAdded={handleCommentAdded} />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditOpen}
        post={post}
        onClose={() => setIsEditOpen(false)}
        onPostUpdated={handlePostUpdated}
      />

      {/* Delete Post Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeletePostOpen}
        title="Delete Discussion Post"
        message={
          <>
            <p style={{ marginBottom: 8 }}>
              Are you sure you want to permanently delete <strong>"{post.title}"</strong>?
            </p>
            <p style={{ color: "#c1493d", fontSize: 13 }}>
              ⚠️ Warning: Deleting this post will also permanently remove all <strong>{comments.length}</strong> dependent comment(s) and any files uploaded to this post.
            </p>
          </>
        }
        confirmText="Delete Post"
        confirmVariant="danger"
        loading={deletingPost}
        onConfirm={handleDeletePost}
        onCancel={() => setIsDeletePostOpen(false)}
      />

      {/* Delete Comment Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(commentToDelete)}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        confirmVariant="danger"
        loading={Boolean(deletingCommentId)}
        onConfirm={handleDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
}
