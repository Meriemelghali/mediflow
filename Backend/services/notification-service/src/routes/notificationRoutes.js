const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/email/welcome', notificationController.sendWelcomeEmail);
router.post('/email/reset-password', notificationController.sendResetPasswordEmail);

module.exports = router;
