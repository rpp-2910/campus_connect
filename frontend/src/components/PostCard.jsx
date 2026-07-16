import VoteButtons from './VoteButtons';



export default function PostCard({ post, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        backgroundColor: 'white'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {post.category}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {post.username} · Year {post.year}
        </span>
      </div>

      <h3 style={{ margin: '8px 0' }}>{post.title}</h3>

      <p style={{ color: '#475569', fontSize: '14px' }}>
        {post.content.length > 150
          ? post.content.substring(0, 150) + '...'
          : post.content}
      </p>

      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
        <VoteButtons postId={post.id} initialCount={post.vote_count} />
        <span>💬 {post.comment_count} comments</span>
      </div>
    </div>
  );
}