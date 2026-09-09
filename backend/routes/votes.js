const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { votePost, removeVote, getMyVote } = require('../controllers/votesController');

// Upvote/downvote a post (requires login) — upserts
router.post('/posts/:id/vote', verifyToken, votePost);

// Remove vote from a post (requires login)
router.delete('/posts/:id/vote', verifyToken, removeVote);

// Get current authenticated user's vote for a post
router.get('/posts/:id/my-vote', verifyToken, getMyVote);

module.exports = router;