import VoteButtons from "./VoteButtons";
import { categoryColor, initials } from "../lib/categories";

export default function PostCard({ post, onClick, featured = false }) {
  const color = categoryColor(post.category);

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <article
      onClick={onClick}
      className={`feed-post-card ${featured ? "feed-post-card-featured" : ""}`}
      style={{ "--category-color": color }}
    >
      <div className="post-card-topline">
        <span className="post-category">{post.category}</span>
        {formattedDate && (
          <span style={{ fontSize: 11, color: featured ? "rgba(255,255,255,0.5)" : "var(--ink-faint)", fontWeight: 600 }}>
            {formattedDate}
          </span>
        )}
      </div>

      <h3 className="post-card-title">{post.title}</h3>
      <p className="post-card-preview">
        {post.content.length > (featured ? 240 : 170)
          ? post.content.substring(0, featured ? 240 : 170) + "…"
          : post.content}
      </p>

      <div className="post-card-footer">
        <div className="post-author">
          <span className="post-author-avatar">{initials(post.username)}</span>
          <span>
            <strong>{post.username}</strong>
            <small>
              Year {post.year || 1}
              {post.branch ? ` · ${post.branch}` : ""}
            </small>
          </span>
        </div>

        <div className="post-stats" onClick={(e) => e.stopPropagation()}>
          <VoteButtons
            postId={post.id}
            initialCount={post.vote_count}
            initialUserVote={post.current_user_vote}
          />
          <span className="post-comment-count">
            💬 {post.comment_count || 0}
          </span>
        </div>
      </div>
    </article>
  );
}
