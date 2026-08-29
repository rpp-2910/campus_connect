const express = require('express');
const verifyToken = require('../middleware//verifyToken');
const { updateVoteWeight } = require("../controllers/assistantController");
const pool = require("../config/db");
const router = express.Router();


// Upvote/downvote a post (requires login) — upserts, so re-voting changes instead of duplicating
router.post("/posts/:id/vote", verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { vote_type } = req.body; // 1 or -1
    const user_id = req.user.id;

    if (vote_type !== 1 && vote_type !== -1) {
      return res.status(400).json({ error: "vote_type must be 1 or -1" });
    }

    const result = await pool.query(
      `INSERT INTO votes (post_id, user_id, vote_type)
             VALUES ($1, $2, $3)
             ON CONFLICT (post_id, user_id)
             DO UPDATE SET vote_type = EXCLUDED.vote_type
             RETURNING *`,
      [id, user_id, vote_type],
    );

    await updateVoteWeight(id);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove your vote from a post (requires login)
router.delete("/posts/:id/vote", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `DELETE FROM votes WHERE post_id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id],
    );

    await updateVoteWeight(id);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No vote found to remove" });
    }

    res.json({ message: "Vote removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;