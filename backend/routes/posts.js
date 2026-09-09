const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { optionalToken } = require('../middleware/verifyToken');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/postsController');
const {
  presignAttachment,
  confirmAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
} = require('../controllers/attachmentsController');
const {
  addComment,
  deleteComment,
  getCommentsByPost,
} = require('../controllers/commentsController');

// ── Posts CRUD ──────────────────────────────────────────────
router.get('/', getPosts);
router.get('/:id', optionalToken, getPostById);
router.post('/', verifyToken, createPost);
router.patch('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);

// ── Comments Sub-route (/posts/:id/comments) ─────────────────
router.get('/:id/comments', getCommentsByPost);
router.post('/:id/comments', verifyToken, addComment);
router.delete('/:postId/comments/:id', verifyToken, deleteComment);

// ── Attachments Lifecycle ──────────────────────────────────
router.post('/:id/attachments/presign', verifyToken, presignAttachment);
router.post('/:id/attachments', verifyToken, confirmAttachment);
router.get('/:id/attachments', getAttachments);
router.get('/:id/attachments/:attachmentId/download', verifyToken, downloadAttachment);
router.delete('/:postId/attachments/:attachmentId', verifyToken, deleteAttachment);

module.exports = router;