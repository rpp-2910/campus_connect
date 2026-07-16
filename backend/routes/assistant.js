const express = require('express');
const router = express.Router();
const { askAssistant } = require('../controllers/assistantController');
const verifyToken = require('../middleware/verifyToken');

router.post('/ask', verifyToken, askAssistant);

module.exports = router;