import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function CreatePostPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await client.post('/posts', formData);
      navigate(`/posts/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h2>Create Post</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Title</label><br />
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Category</label><br />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option>Academics & Notes</option>
            <option>Professors & Courses</option>
            <option>Placements & Internships</option>
            <option>Campus Life</option>
            <option>General</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Content</label><br />
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={6}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}