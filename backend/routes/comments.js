const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { addComment, deleteComment, getCommentsByPost } = require('../controllers/commentsController');

// Add a comment to a post (requires login) — supports both /posts/:id/comments and /:id/comments
router.post('/posts/:id/comments', verifyToken, addComment);
router.post('/:id/comments', verifyToken, addComment);

// Get all comments for a post
router.get('/posts/:id/comments', getCommentsByPost);
router.get('/:id/comments', getCommentsByPost);

// Delete a comment (author or moderator only)
router.delete('/comments/:id', verifyToken, deleteComment);
router.delete('/posts/:postId/comments/:id', verifyToken, deleteComment);

module.exports = router;