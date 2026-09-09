const pool = require('../config/db');
const { updateVoteWeight } = require('./assistantController');

// Upvote or downvote a post (requires login)
async function votePost(req, res) {
  try {
    const { id } = req.params; // post id
    const { vote_type } = req.body; // 1 or -1
    const user_id = req.user.id;

    if (vote_type !== 1 && vote_type !== -1) {
      return res.status(400).json({ error: "vote_type must be 1 or -1" });
    }

    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const result = await pool.query(
      `INSERT INTO votes (post_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET vote_type = EXCLUDED.vote_type
       RETURNING *`,
      [id, user_id, vote_type]
    );

    await updateVoteWeight(id);

    // Calculate current vote count
    const countResult = await pool.query(
      `SELECT 
         COUNT(id) FILTER (WHERE vote_type = 1) - 
         COUNT(id) FILTER (WHERE vote_type = -1) AS vote_count 
       FROM votes WHERE post_id = $1`,
      [id]
    );

    const vote_count = parseInt(countResult.rows[0]?.vote_count || 0, 10);

    res.status(200).json({
      ...result.rows[0],
      vote_count,
      user_vote: vote_type,
    });
  } catch (err) {
    console.error("Vote failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// Remove vote from a post (requires login)
async function removeVote(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `DELETE FROM votes WHERE post_id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id]
    );

    await updateVoteWeight(id);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No vote found to remove" });
    }

    const countResult = await pool.query(
      `SELECT 
         COUNT(id) FILTER (WHERE vote_type = 1) - 
         COUNT(id) FILTER (WHERE vote_type = -1) AS vote_count 
       FROM votes WHERE post_id = $1`,
      [id]
    );

    const vote_count = parseInt(countResult.rows[0]?.vote_count || 0, 10);

    res.json({
      message: "Vote removed",
      vote_count,
      user_vote: null,
    });
  } catch (err) {
    console.error("Remove vote failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// Get the authenticated user's vote on a specific post
async function getMyVote(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT vote_type FROM votes WHERE post_id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ vote_type: null });
    }

    res.json({ vote_type: result.rows[0].vote_type });
  } catch (err) {
    console.error("Get my vote failed:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  votePost,
  removeVote,
  getMyVote,
};
