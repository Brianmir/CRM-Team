const express = require('express');
const router = express.Router();
const { forgotPassword, resetPassword, register, login } = require('../controllers/authController');

// Registro y login ya existentes...
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
