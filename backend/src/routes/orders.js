const express = require('express');
const router = express.Router();
const { getOpenOrders, markOrderAsShipped } = require('../controllers/ordersController');

// Le rotte sono relative a /api/orders

router.get('/:shopId/open', getOpenOrders);
router.put('/:shopId/:receiptId/ship', markOrderAsShipped);

module.exports = router;
