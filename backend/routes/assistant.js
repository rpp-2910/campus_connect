const express = require('express');
const router = express.Router();
const { askAssistant, searchPosts} = require('../controllers/assistantController');
const verifyToken = require('../middleware/verifyToken');

router.post('/ask', verifyToken, askAssistant);
router.post("/search", searchPosts);

module.exports = router;