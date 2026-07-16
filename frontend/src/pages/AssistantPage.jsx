import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await client.post('/ask', { question });
      setResult(response.data);
    } catch (err) {
      setResult({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2>AI Campus Assistant</h2>
      <p style={{ color: '#64748b' }}>
        Ask anything about campus life, placements, professors, or courses.
        Answers are based on real posts from your seniors.
      </p>

      <form onSubmit={handleAsk} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I prepare for TCS placement?"
            style={{ flex: 1, padding: '10px', fontSize: '15px' }}
          />
          <button type="submit" disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Asking...' : 'Ask'}
          </button>
        </div>
      </form>

      {result && (
        <div>
          {result.error && (
            <p style={{ color: 'red' }}>{result.error}</p>
          )}

          {result.no_results && (
            <div style={{ padding: '16px', backgroundColor: '#fef9c3', borderRadius: '8px', marginBottom: '16px' }}>
              <p>{result.answer}</p>
              <button
                onClick={() => navigate('/create')}
                style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                Post this question
              </button>
            </div>
          )}

          {result.answer && !result.no_results && (
            <div style={{ marginBottom: '24px' }}>
              <h3>Answer</h3>
              <div style={{ padding: '16px', backgroundColor: '#f0f4ff', borderRadius: '8px', lineHeight: '1.6' }}>
                {result.answer}
              </div>
            </div>
          )}

          {result.sources && result.sources.length > 0 && (
            <div>
              <h3>Sources</h3>
              {result.sources.map((source, i) => (
                <div
                  key={source.post_id}
                  onClick={() => navigate(`/posts/${source.post_id}`)}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Source {i + 1}: </span>
                    <span>{source.title}</span>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      by {source.username} · Year {source.year} · {source.category}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>
                    {(source.relevance_score * 100).toFixed(0)}% match
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}