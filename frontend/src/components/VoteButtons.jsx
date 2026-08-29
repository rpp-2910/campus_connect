import { useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

function Chevron({ up }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d={up ? "M2 9L7 4L12 9" : "M2 5L7 10L12 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VoteButtons({ postId, initialCount }) {
  const [voteCount, setVoteCount] = useState(Number(initialCount));
  const [userVote, setUserVote] = useState(null); // 1, -1, or null
  const { user } = useAuth();

  const handleVote = async (type) => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    try {
      if (userVote === type) {
        // clicking same vote again → remove vote
        await client.delete(`/posts/${postId}/vote`);
        setVoteCount((prev) => prev - type);
        setUserVote(null);
      } else {
        // new vote or changing vote
        await client.post(`/posts/${postId}/vote`, { vote_type: type });

        if (userVote !== null) {
          // was -1, now +1 (or vice versa) → difference is 2
          setVoteCount((prev) => prev + type * 2);
        } else {
          // no previous vote
          setVoteCount((prev) => prev + type);
        }
        setUserVote(type);
      }
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const btnStyle = (active, color) => ({
    background: active ? `var(--${color}-bg)` : "transparent",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    color: active ? `var(--${color})` : "var(--ink-faint)",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "var(--paper)",
        border: "1px solid var(--border-soft)",
        borderRadius: 8,
        padding: "2px 4px",
      }}
      onClick={(e) => e.stopPropagation()} // prevent card click when voting
    >
      <button
        onClick={() => handleVote(1)}
        style={btnStyle(userVote === 1, "green")}
        aria-label="Upvote"
      >
        <Chevron up />
      </button>

      <span
        style={{
          fontWeight: 700,
          minWidth: 22,
          textAlign: "center",
          fontSize: 13.5,
        }}
      >
        {voteCount}
      </span>

      <button
        onClick={() => handleVote(-1)}
        style={btnStyle(userVote === -1, "red")}
        aria-label="Downvote"
      >
        <Chevron />
      </button>
    </div>
  );
}
