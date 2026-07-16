import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VoteButtons({ postId, initialCount }) {
  const [voteCount, setVoteCount] = useState(Number(initialCount));
  const [userVote, setUserVote] = useState(null); // 1, -1, or null
  const { user } = useAuth();

  const handleVote = async (type) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      if (userVote === type) {
        // clicking same vote again → remove vote
        await client.delete(`/posts/${postId}/vote`);
        setVoteCount(prev => prev - type);
        setUserVote(null);
      } else {
        // new vote or changing vote
        await client.post(`/posts/${postId}/vote`, { vote_type: type });
        
        if (userVote !== null) {
          // was -1, now +1 (or vice versa) → difference is 2
          setVoteCount(prev => prev + type * 2);
        } else {
          // no previous vote
          setVoteCount(prev => prev + type);
        }
        setUserVote(type);
      }
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      onClick={(e) => e.stopPropagation()} // prevent card click when voting
    >
      <button
        onClick={() => handleVote(1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          color: userVote === 1 ? '#2563eb' : '#64748b'
        }}
      >
        ⬆️
      </button>

      <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
        {voteCount}
      </span>

      <button
        onClick={() => handleVote(-1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          color: userVote === -1 ? '#dc2626' : '#64748b'
        }}
      >
        ⬇️
      </button>
    </div>
  );
}