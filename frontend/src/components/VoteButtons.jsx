import { useState, useEffect } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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

export default function VoteButtons({ postId, initialCount, initialUserVote }) {
  const [voteCount, setVoteCount] = useState(Number(initialCount || 0));
  const [userVote, setUserVote] = useState(initialUserVote !== undefined ? initialUserVote : null); // 1, -1, or null
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Sync state if props update
  useEffect(() => {
    setVoteCount(Number(initialCount || 0));
  }, [initialCount]);

  useEffect(() => {
    if (initialUserVote !== undefined) {
      setUserVote(initialUserVote);
    }
  }, [initialUserVote]);

  // Hydrate vote state from server on mount if not supplied by parent
  useEffect(() => {
    if (!user || initialUserVote !== undefined || !postId) return;

    let isMounted = true;
    const fetchMyVote = async () => {
      try {
        const res = await client.get(`/posts/${postId}/my-vote`);
        if (isMounted && res.data) {
          setUserVote(res.data.vote_type);
        }
      } catch (err) {
        console.error("Failed to load user vote:", err);
      }
    };

    fetchMyVote();

    return () => {
      isMounted = false;
    };
  }, [postId, user, initialUserVote]);

  const handleVote = async (type) => {
    if (!user) {
      toast.info("Please log in to vote");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (userVote === type) {
        // clicking same vote again → remove vote
        const res = await client.delete(`/posts/${postId}/vote`);
        setUserVote(null);
        if (res.data && res.data.vote_count !== undefined) {
          setVoteCount(res.data.vote_count);
        } else {
          setVoteCount((prev) => prev - type);
        }
      } else {
        // new vote or toggling vote
        const res = await client.post(`/posts/${postId}/vote`, { vote_type: type });
        setUserVote(type);
        if (res.data && res.data.vote_count !== undefined) {
          setVoteCount(res.data.vote_count);
        } else {
          setVoteCount((prev) => (userVote !== null ? prev + type * 2 : prev + type));
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
      toast.error(err.response?.data?.error || "Failed to update vote");
    } finally {
      setLoading(false);
    }
  };

  const btnStyle = (active, color) => ({
    background: active ? `var(--${color}-bg)` : "transparent",
    border: "none",
    borderRadius: 6,
    cursor: loading ? "wait" : "pointer",
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
        disabled={loading}
      >
        <Chevron up />
      </button>

      <span
        style={{
          fontWeight: 700,
          minWidth: 22,
          textAlign: "center",
          fontSize: 13.5,
          color: userVote === 1 ? "var(--green)" : userVote === -1 ? "var(--red)" : "inherit",
        }}
      >
        {voteCount}
      </span>

      <button
        onClick={() => handleVote(-1)}
        style={btnStyle(userVote === -1, "red")}
        aria-label="Downvote"
        disabled={loading}
      >
        <Chevron />
      </button>
    </div>
  );
}
