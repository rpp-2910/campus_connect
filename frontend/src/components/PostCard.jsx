import VoteButtons from "./VoteButtons";
import { categoryColor, initials } from "../lib/categories";

export default function PostCard({ post, onClick }) {
  const color = categoryColor(post.category);

  return (
    <div
      onClick={onClick}
      className="card tab-card"
      style={{
        "--tab-color": color,
        padding: "16px 18px 16px 22px",
        marginBottom: 12,
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-md)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
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
            style={{ width: 22, height: 22, fontSize: 10.5 }}
          >
            {initials(post.username)}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
            {post.username} · Year {post.year}
          </span>
        </div>
      </div>

      <h3 style={{ marginBottom: 6 }}>{post.title}</h3>

      <p
        style={{
          color: "var(--ink-soft)",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        {post.content.length > 150
          ? post.content.substring(0, 150) + "…"
          : post.content}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <VoteButtons postId={post.id} initialCount={post.vote_count} />
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          💬 {post.comment_count} comments
        </span>
      </div>
    </div>
  );
}
