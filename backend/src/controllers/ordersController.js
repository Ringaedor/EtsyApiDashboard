const axios = require('axios');
const dbService = require('../services/dbService');

const getEtsyApi = async (shopId) => {
  const authData = await dbService.getEtsyAuthByShopId(shopId);
  if (!authData) {
    throw new Error('Credenziali non trovate.');
  }
  return axios.create({
    baseURL: 'https://openapi.etsy.com/v3',
    headers: {
      'Authorization': `Bearer ${authData.access_token}`,
      'x-api-key': process.env.ETSY_CLIENT_ID,
    },
  });
};

const getOpenOrders = async (req, res) => {
  const { shopId } = req.params;
  try {
    const etsyApi = await getEtsyApi(shopId);
    const params = { was_shipped: 'false', limit: 100 };
    const response = await etsyApi.get(`/application/shops/${shopId}/receipts`, { params });
    res.json(response.data.results);
  } catch (error) {
    console.error("Errore nel recuperare gli ordini:", error.message);
    res.status(500).json({ message: 'Errore nel recuperare gli ordini.' });
  }
};

const markOrderAsShipped = async (req, res) => {
  const { shopId, receiptId } = req.params;
  try {
    const etsyApi = await getEtsyApi(shopId);
    const payload = { was_shipped: true };
    await etsyApi.put(`/application/shops/${shopId}/receipts/${receiptId}`, payload);
    res.status(200).json({ message: `Ordine #${receiptId} segnato come spedito.` });
  } catch (error) {
    console.error(`Errore nell'aggiornare l'ordine #${receiptId}:`, error.message);
    res.status(500).json({ message: `Errore nell'aggiornare l'ordine #${receiptId}.` });
  }
};

module.exports = {
  getOpenOrders,
  markOrderAsShipped,
};
