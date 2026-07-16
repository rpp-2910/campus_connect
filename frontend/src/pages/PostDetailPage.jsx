import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import VoteButtons from '../components/VoteButtons';
import CommentBox from '../components/CommentBox';

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await client.get(`/posts/${id}`);
      setPost(response.data);
      setComments(response.data.comments);
    } catch (err) {
      console.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments(prev => [...prev, newComment]);
  };

  if (loading) return <p style={{ padding: '20px' }}>Loading...</p>;
  if (!post) return <p style={{ padding: '20px' }}>Post not found</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      
      {/* Post */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#2563eb', fontSize: '13px' }}>{post.category}</span>
          <span style={{ color: '#64748b', fontSize: '13px' }}>{post.username} · Year {post.year}</span>
        </div>

        <h2>{post.title}</h2>
        <p style={{ lineHeight: '1.6', color: '#374151' }}>{post.content}</p>

        <VoteButtons postId={post.id} initialCount={post.vote_count || 0} />
      </div>

      {/* Comments */}
      <h3>Comments ({comments.length})</h3>

      {comments.length === 0 && (
        <p style={{ color: '#64748b' }}>No comments yet. Be the first!</p>
      )}

      {comments.map(comment => (
        <div key={comment.id} style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{comment.username}</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p style={{ margin: 0 }}>{comment.content}</p>
        </div>
      ))}

      {/* Add Comment */}
      <CommentBox postId={id} onCommentAdded={handleCommentAdded} />
    </div>
  );
}