const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/email/welcome', notificationController.sendWelcomeEmail);

module.exports = router;
