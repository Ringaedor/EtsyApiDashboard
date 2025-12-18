const express = require('express');
const router = express.Router();
const { getShopStats } = require('../controllers/shopController');

// GET /api/shop/:shopId/stats - Recupera le statistiche del negozio
router.get('/:shopId/stats', getShopStats);

module.exports = router;
