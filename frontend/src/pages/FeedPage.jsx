import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import PostCard from '../components/PostCard';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      const response = await client.get('/posts', { params });
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Academics & Notes',
    'Professors & Courses',
    'Placements & Internships',
    'Campus Life',
    'General'
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Campus Feed</h2>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat === 'All' ? '' : cat)}
            style={{
              padding: '6px 14px',
              backgroundColor: category === cat || (cat === 'All' && category === '') ? '#2563eb' : '#e2e8f0',
              color: category === cat || (cat === 'All' && category === '') ? 'white' : 'black',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading && <p>Loading posts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && posts.length === 0 && <p>No posts yet. Be the first to post!</p>}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => navigate(`/posts/${post.id}`)}
        />
      ))}
    </div>
  );
}