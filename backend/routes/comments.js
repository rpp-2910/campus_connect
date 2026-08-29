const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const verifyToken = require("../middleware/verifyToken");


// Add a comment to a post (requires login)
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { content } = req.body;
    const user_id = req.user.id;

    // Optional: ensure post exists
    const postCheck = await pool.query(`SELECT id FROM posts WHERE id = $1`, [
      id,
    ]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const insert = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, post_id, user_id, content, created_at`,
      [id, user_id, content],
    );

    // Attach username
    const comment = insert.rows[0];
    const userRes = await pool.query(
      `SELECT username FROM users WHERE id = $1`,
      [user_id],
    );
    comment.username = userRes.rows[0] ? userRes.rows[0].username : null;

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment (only the author can delete)
router.delete('/comments/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const commentResult = await pool.query(
            `SELECT user_id FROM comments WHERE id = $1`,
            [id]
        );

        if (commentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (commentResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden — not your comment' });
        }

        await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;