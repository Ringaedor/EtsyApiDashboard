const express = require('express');
const router = express.Router();
const { redirectToEtsy, handleEtsyCallback } = require('../controllers/authController');

// GET /api/auth/etsy - Inizia il flusso di autenticazione
router.get('/etsy', redirectToEtsy);

// GET /api/auth/etsy/callback - Gestisce il callback da Etsy
router.get('/etsy/callback', handleEtsyCallback);

module.exports = router;
