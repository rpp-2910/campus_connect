const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const verifyToken = require("../middleware/verifyToken");
const { embedPost } = require("../controllers/assistantController");

router.get("/", async (req, res) => {
  try {
    const { category, year_min } = req.query;

    let query = `
            SELECT 
                p.id, p.title, p.content, p.category, p.created_at,
                u.username, u.year, u.branch,
                COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 1) -
                COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = -1) AS vote_count,
                COUNT(DISTINCT c.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN votes v ON p.id = v.post_id
            LEFT JOIN comments c ON p.id = c.post_id
        `;

    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (year_min) {
      values.push(year_min);
      conditions.push(`u.year >= $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += `
            GROUP BY p.id, u.username, u.year, u.branch
            ORDER BY p.created_at DESC
        `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `SELECT
      p.id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      u.username,
      u.year,
      u.branch,

      COUNT(v.id) FILTER (WHERE v.vote_type = 1) -
      COUNT(v.id) FILTER (WHERE v.vote_type = -1) AS vote_count

   FROM posts p

   JOIN users u
      ON p.user_id = u.id

   LEFT JOIN votes v
      ON p.id = v.post_id

   WHERE p.id = $1

   GROUP BY
      p.id,
      u.username,
      u.year,
      u.branch`,
      [id],
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const commentsResult = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
      [id],
    );

    res.json({
      ...postResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const user_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO posts (user_id, title, content, category)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [user_id, title, content, category],
    );

    const newPost = result.rows[0];

    // Embed the post so it's searchable by the assistant
    await embedPost(newPost.id, `${title}\n${content}`);

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [id],
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (postResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden — not your post" });
    }

    await pool.query(`DELETE FROM posts WHERE id = $1`, [id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments routes
// Get all comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.username, u.id AS user_id
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;