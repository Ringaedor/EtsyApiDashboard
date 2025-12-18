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

const getActiveListings = async (req, res) => {
  const { shopId } = req.params;
  try {
    const etsyApi = await getEtsyApi(shopId);
    const params = { state: 'active', limit: 100, includes: 'images,inventory' };
    const response = await etsyApi.get(`/application/shops/${shopId}/listings`, { params });
    res.json(response.data.results);
  } catch (error) {
    console.error("Errore nel recuperare le inserzioni:", error.message);
    res.status(500).json({ message: 'Errore nel recuperare le inserzioni.' });
  }
};

const updateListing = async (req, res) => {
    const { shopId, listingId } = req.params;
    const { price, quantity } = req.body;

    if (price === undefined || quantity === undefined) {
        return res.status(400).json({ message: 'Prezzo e quantità sono obbligatori.' });
    }

    try {
        const etsyApi = await getEtsyApi(shopId);

        const listingResponse = await etsyApi.get(`/application/listings/${listingId}`);
        const hasVariations = listingResponse.data.has_variations;

        if (hasVariations) {
            const inventoryResponse = await etsyApi.get(`/application/listings/${listingId}/inventory`);
            const inventory = inventoryResponse.data;

            if (!inventory.products || inventory.products.length === 0) {
                throw new Error("Inventario non trovato per inserzione con variazioni.");
            }

            const products = inventory.products;
            products[0].offerings[0].price.amount = parseInt(price * products[0].offerings[0].price.divisor, 10);
            products[0].offerings[0].quantity = parseInt(quantity, 10);

            await etsyApi.put(`/application/listings/${listingId}/inventory`, { products });

        } else {
            const payload = { price: parseFloat(price), quantity: parseInt(quantity, 10) };
            await etsyApi.patch(`/application/listings/${listingId}`, payload);
        }

        res.status(200).json({ message: `Inserzione #${listingId} aggiornata con successo.` });

    } catch (error) {
        console.error(`Errore nell'aggiornare l'inserzione #${listingId}:`, error.response?.data || error.message);
        res.status(500).json({ message: `Errore nell'aggiornare l'inserzione #${listingId}.` });
    }
};

module.exports = {
  getActiveListings,
  updateListing,
};
