-- Tabella per memorizzare i token di autenticazione di Etsy
CREATE TABLE IF NOT EXISTS etsy_auth (
    shop_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Potremmo anche aggiungere un trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON etsy_auth
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE etsy_auth IS 'Memorizza le credenziali OAuth2 per ogni negozio Etsy autenticato.';
COMMENT ON COLUMN etsy_auth.shop_id IS 'L''ID univoco del negozio Etsy, usato come chiave primaria.';
COMMENT ON COLUMN etsy_auth.user_id IS 'L''ID dell''utente Etsy proprietario del negozio.';
COMMENT ON COLUMN etsy_auth.access_token IS 'Il token di accesso OAuth2 per le richieste API.';
COMMENT ON COLUMN etsy_auth.refresh_token IS 'Il token di refresh per ottenere nuovi access token.';
COMMENT ON COLUMN etsy_auth.expires_at IS 'La data e ora di scadenza dell''access_token.';
