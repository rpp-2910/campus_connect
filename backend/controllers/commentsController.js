const pool = require('../config/db');

// Add a comment to a post (requires login)
async function addComment(req, res) {
  try {
    const { id } = req.params; // post id
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const insert = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [id, user_id, content.trim()]
    );

    const comment = insert.rows[0];
    const userRes = await pool.query(
      `SELECT username, branch, year FROM users WHERE id = $1`,
      [user_id]
    );

    const userObj = userRes.rows[0] || {};
    comment.username = userObj.username || null;
    comment.branch = userObj.branch || null;
    comment.year = userObj.year || null;

    res.status(201).json(comment);
  } catch (err) {
    console.error("Add comment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// Delete a comment (only author or moderator can delete)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role || 'student';

    const commentResult = await pool.query(
      `SELECT id, post_id, user_id FROM comments WHERE id = $1`,
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = commentResult.rows[0];
    const isOwner = comment.user_id === user_id;
    const isModerator = user_role === 'moderator' || user_role === 'admin';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: "Forbidden — you can only delete your own comments" });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ message: "Comment deleted", id: Number(id), post_id: comment.post_id });
  } catch (err) {
    console.error("Delete comment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// Get all comments for a post
async function getCommentsByPost(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.post_id, c.content, c.created_at, c.user_id, u.username, u.year, u.branch
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get comments failed:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addComment,
  deleteComment,
  getCommentsByPost,
};
