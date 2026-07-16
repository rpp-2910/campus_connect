import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function CommentBox({ postId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      const response = await client.post(`/posts/${postId}/comments`, { content });
      onCommentAdded(response.data);
      setContent('');
    } catch (err) {
      console.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p style={{ color: '#64748b' }}>Please login to comment.</p>;

  return (
    <div style={{ marginTop: '24px' }}>
      <h4>Add a Comment</h4>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share your experience or answer..."
          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}