const axios = require('axios');
const dbService = require('../services/dbService');

const getShopStats = async (req, res) => {
  const { shopId } = req.params;

  try {
    const authData = await dbService.getEtsyAuthByShopId(shopId);
    if (!authData) {
      return res.status(404).json({ message: 'Credenziali non trovate per questo negozio.' });
    }

    const etsyApi = axios.create({
      baseURL: 'https://openapi.etsy.com/v3',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'x-api-key': process.env.ETSY_CLIENT_ID
      }
    });

    const response = await etsyApi.get(`/application/shops/${shopId}`);

    const { shop_name, listing_active_count, transaction_sold_count, review_count } = response.data;
    res.json({
      shopName: shop_name,
      activeListings: listing_active_count,
      totalSales: transaction_sold_count,
      reviewCount: review_count,
    });

  } catch (error) {
    console.error("Errore nel recuperare le statistiche del negozio:", error.response?.data || error.message);
    res.status(500).json({ message: 'Errore nel recuperare le statistiche del negozio.' });
  }
};

module.exports = {
  getShopStats,
};
