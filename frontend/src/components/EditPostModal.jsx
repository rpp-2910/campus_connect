import { useState, useEffect } from 'react';
import client from '../api/client';
import { CATEGORIES } from '../lib/categories';
import { useToast } from '../context/ToastContext';

export default function EditPostModal({ isOpen, post, onClose, onPostUpdated }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        category: post.category || 'General',
      });
      setError('');
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await client.patch(`/posts/${post.id}`, formData);
      toast.success('Post updated successfully');
      onPostUpdated(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update post';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => !loading && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 27, 51, 0.65)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e5e1d6)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
          textAlign: 'left',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Edit Post</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--ink-soft)',
            }}
          >
            ✕
          </button>
        </div>

        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Title
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="What's this about?"
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              placeholder="Share the details…"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, #e5e1d6)',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
