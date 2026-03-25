const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contactController');

// @route   POST /api/contact
// @access  Public
router.post('/', sendContactMessage);

module.exports = router;