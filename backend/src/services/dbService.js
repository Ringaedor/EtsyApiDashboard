const db = require('../config/db');

/**
 * Salva o aggiorna le credenziali di autenticazione di un utente Etsy.
 * Se l'utente esiste già, aggiorna i token; altrimenti, crea un nuovo record.
 * @param {object} authData Dati di autenticazione
 * @param {number} authData.shopId ID del negozio Etsy
 * @param {number} authData.userId ID dell'utente Etsy
 * @param {string} authData.accessToken Il token di accesso
 * @param {string} authData.refreshToken Il token di refresh
 * @param {Date} authData.expiresAt La data di scadenza del token
 */
const upsertEtsyAuth = async ({ shopId, userId, accessToken, refreshToken, expiresAt }) => {
  const query = `
    INSERT INTO etsy_auth (shop_id, user_id, access_token, refresh_token, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (shop_id) DO UPDATE
      SET access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW();
  `;
  const values = [shopId, userId, accessToken, refreshToken, expiresAt];
  await db.query(query, values);
};

/**
 * Recupera le credenziali di autenticazione per un dato shopId.
 * @param {number} shopId L'ID del negozio Etsy
 * @returns {Promise<object|null>} I dati di autenticazione o null se non trovati.
 */
const getEtsyAuthByShopId = async (shopId) => {
  const query = 'SELECT * FROM etsy_auth WHERE shop_id = $1;';
  const { rows } = await db.query(query, [shopId]);
  return rows[0] || null;
};

module.exports = {
  upsertEtsyAuth,
  getEtsyAuthByShopId,
};
