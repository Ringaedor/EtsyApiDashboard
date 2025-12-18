const axios = require('axios');
const crypto = require('crypto');
const dbService = require('../services/dbService');

const etsyOAuth2 = {
  authUrl: 'https://www.etsy.com/oauth/connect',
  tokenUrl: 'https://api.etsy.com/v3/public/oauth/token',
  scopes: 'listings_r listings_w transactions_r transactions_w profile_r email_r shops_r',
};

const { ETSY_CLIENT_ID, ETSY_CLIENT_SECRET, ETSY_REDIRECT_URI, FRONTEND_URL } = process.env;

let pkceStore = {};

const redirectToEtsy = (req, res) => {
  const state = crypto.randomBytes(20).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  pkceStore[state] = codeVerifier;

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const authUrl = new URL(etsyOAuth2.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', ETSY_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', ETSY_REDIRECT_URI);
  authUrl.searchParams.set('scope', etsyOAuth2.scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
};

const handleEtsyCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Errore: codice o state mancante.');
  }

  const codeVerifier = pkceStore[state];
  if (!codeVerifier) {
    return res.status(400).send('Errore: state non valido o scaduto.');
  }

  delete pkceStore[state];

  try {
    const response = await axios.post(etsyOAuth2.tokenUrl, new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ETSY_CLIENT_ID,
      redirect_uri: ETSY_REDIRECT_URI,
      code,
      code_verifier: codeVerifier,
    }));

    const { access_token, refresh_token, expires_in } = response.data;
    const etsyUserId = response.data.user_id;

    const etsyApi = axios.create({
      baseURL: 'https://openapi.etsy.com/v3',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'x-api-key': ETSY_CLIENT_ID
      }
    });
    const shopsResponse = await etsyApi.get(`/application/users/${etsyUserId}/shops`);
    const shop = shopsResponse.data.results[0];
    if (!shop) {
      throw new Error("Nessun negozio trovato per questo utente.");
    }
    const shopId = shop.shop_id;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await dbService.upsertEtsyAuth({
      shopId,
      userId: etsyUserId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    });

    res.redirect(`${FRONTEND_URL}?auth_success=true&shop_id=${shopId}`);

  } catch (error) {
    console.error("Errore durante lo scambio del token:", error.response?.data || error.message);
    res.status(500).send('Si è verificato un errore durante l\'autenticazione.');
  }
};

module.exports = {
  redirectToEtsy,
  handleEtsyCallback,
};
