import os
from flask import Flask, render_template, session, redirect, url_for, request, flash
from requests_oauthlib import OAuth2Session
import json
from datetime import datetime

# --- Configuration ---
ETSY_CLIENT_ID = os.environ.get("ETSY_CLIENT_ID")
ETSY_CLIENT_SECRET = os.environ.get("ETSY_CLIENT_SECRET")
REDIRECT_URI = os.environ.get("ETSY_REDIRECT_URI", 'http://localhost:5000/callback')

# --- Etsy API URLs ---
AUTHORIZATION_BASE_URL = 'https://www.etsy.com/oauth/connect'
TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token'
API_BASE_URL = 'https://openapi.etsy.com/v3/application'

# --- Scopes ---
SCOPES = ['listings_r', 'listings_w', 'transactions_r', 'transactions_w', 'profile_r', 'email_r', 'shops_r']

# --- Flask App Initialization ---
app = Flask(__name__)
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY")
if not SECRET_KEY:
    print("ATTENZIONE: FLASK_SECRET_KEY non impostata. Uso una chiave temporanea non sicura.")
    SECRET_KEY = os.urandom(24)
app.secret_key = SECRET_KEY


def get_etsy_session():
    if 'token' not in session:
        return None
    return OAuth2Session(ETSY_CLIENT_ID, token=session['token'])


@app.route('/')
def index():
    if 'token' not in session:
        return render_template('index.html')

    etsy = get_etsy_session()
    try:
        if 'shop_id' not in session:
            user_response = etsy.get(f'{API_BASE_URL}/users/me')
            user_response.raise_for_status()
            user_id = user_response.json().get('user_id')
            if not user_id:
                flash("Impossibile recuperare l'ID utente.", "error")
                return redirect(url_for('logout'))

            shops_response = etsy.get(f'{API_BASE_URL}/users/{user_id}/shops')
            shops_response.raise_for_status()
            shops_data = shops_response.json()
            if shops_data.get('count', 0) > 0:
                session['shop_id'] = shops_data['results'][0]['shop_id']
            else:
                flash("Nessun negozio trovato per questo utente.", "error")
                return redirect(url_for('logout'))

        shop_details_response = etsy.get(f"{API_BASE_URL}/shops/{session['shop_id']}")
        shop_details_response.raise_for_status()
        shop_details = shop_details_response.json()
        return render_template('dashboard.html', shop=shop_details)

    except Exception as e:
        flash(f"Si è verificato un errore: {e}", "error")
        return redirect(url_for('logout'))


@app.route('/orders')
def list_orders():
    if 'token' not in session or 'shop_id' not in session:
        return redirect(url_for('login'))

    etsy = get_etsy_session()
    shop_id = session['shop_id']
    try:
        params = {'was_shipped': 'false', 'limit': 100}
        receipts_response = etsy.get(f'{API_BASE_URL}/shops/{shop_id}/receipts', params=params)
        receipts_response.raise_for_status()
        receipts = receipts_response.json().get('results', [])

        # Formatta il timestamp per ogni ricevuta
        for receipt in receipts:
            timestamp = receipt.get('created_timestamp', 0)
            receipt['created_date'] = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M')

        return render_template('orders.html', receipts=receipts)
    except Exception as e:
        flash(f"Errore nel recuperare gli ordini: {e}", "error")
        return redirect(url_for('index'))


@app.route('/mark_as_shipped/<int:receipt_id>', methods=['POST'])
def mark_as_shipped(receipt_id):
    if 'token' not in session or 'shop_id' not in session:
        return redirect(url_for('login'))

    etsy = get_etsy_session()
    shop_id = session['shop_id']
    try:
        payload = {'was_shipped': True}
        update_response = etsy.put(f'{API_BASE_URL}/shops/{shop_id}/receipts/{receipt_id}', json=payload)
        update_response.raise_for_status()
        flash(f"Ordine #{receipt_id} segnato come spedito!", "success")
    except Exception as e:
        flash(f"Errore nell'aggiornare l'ordine #{receipt_id}: {e}", "error")
    return redirect(url_for('list_orders'))


@app.route('/listings')
def list_listings():
    if 'token' not in session or 'shop_id' not in session:
        return redirect(url_for('login'))

    etsy = get_etsy_session()
    shop_id = session['shop_id']
    try:
        params = {'state': 'active', 'limit': 100, 'includes': 'inventory'}
        listings_response = etsy.get(f'{API_BASE_URL}/shops/{shop_id}/listings', params=params)
        listings_response.raise_for_status()
        listings = listings_response.json().get('results', [])
        return render_template('listings.html', listings=listings)
    except Exception as e:
        flash(f"Errore nel recuperare le inserzioni: {e}", "error")
        return redirect(url_for('index'))


@app.route('/update_listing/<int:listing_id>', methods=['POST'])
def update_listing(listing_id):
    if 'token' not in session or 'shop_id' not in session:
        return redirect(url_for('login'))

    etsy = get_etsy_session()
    shop_id = session['shop_id']
    try:
        price_str = request.form.get('price')
        quantity_str = request.form.get('quantity')

        if price_str is None or quantity_str is None:
            flash("Prezzo e quantità sono obbligatori.", "error")
            return redirect(url_for('list_listings'))

        new_price = float(price_str.replace(',', '.'))
        new_quantity = int(quantity_str)

        # Controlla se l'inserzione ha variazioni
        listing_response = etsy.get(f'{API_BASE_URL}/listings/{listing_id}')
        listing_response.raise_for_status()
        listing_data = listing_response.json()

        if listing_data.get('has_variations'):
            # Logica per inserzioni con variazioni (aggiorna l'inventario)
            inventory_response = etsy.get(f'{API_BASE_URL}/listings/{listing_id}/inventory')
            inventory_response.raise_for_status()
            inventory_data = inventory_response.json()

            products = inventory_data.get('products', [])
            if not products:
                raise Exception("Inventario non trovato per inserzione con variazioni.")

            # Per semplicità, aggiorniamo solo il primo prodotto
            products[0]['offerings'][0]['price']['amount'] = int(new_price * products[0]['offerings'][0]['price']['divisor'])
            products[0]['offerings'][0]['quantity'] = new_quantity

            inventory_payload = {'products': products}

            update_response = etsy.put(
                f'{API_BASE_URL}/listings/{listing_id}/inventory',
                json=inventory_payload
            )
        else:
            # Logica per inserzioni semplici
            payload = {"price": new_price, "quantity": new_quantity}
            update_response = etsy.patch(
                f'{API_BASE_URL}/listings/{listing_id}',
                json=payload
            )

        update_response.raise_for_status()
        flash(f"Inserzione #{listing_id} aggiornata con successo!", "success")

    except ValueError:
        flash("Input non valido. Prezzo e quantità devono essere numeri.", "error")
    except Exception as e:
        flash(f"Errore nell'aggiornare l'inserzione #{listing_id}: {e}", "error")

    return redirect(url_for('list_listings'))


@app.route('/login')
def login():
    if not ETSY_CLIENT_ID or not ETSY_CLIENT_SECRET:
        flash("Credenziali API non configurate.", "error")
        return render_template('index.html')

    etsy = OAuth2Session(ETSY_CLIENT_ID, scope=SCOPES, redirect_uri=REDIRECT_URI)
    authorization_url, state = etsy.authorization_url(AUTHORIZATION_BASE_URL)
    session['oauth_state'] = state
    return redirect(authorization_url)


@app.route('/callback')
def callback():
    if not ETSY_CLIENT_ID or not ETSY_CLIENT_SECRET:
        return "Errore: ETSY_CLIENT_ID e ETSY_CLIENT_SECRET devono essere impostati.", 500

    etsy = OAuth2Session(ETSY_CLIENT_ID, state=session.get('oauth_state'), redirect_uri=REDIRECT_URI)
    token = etsy.fetch_token(
        TOKEN_URL,
        client_secret=ETSY_CLIENT_SECRET,
        code=request.args.get('code'),
        include_client_id=True,
    )
    session['token'] = token
    return redirect(url_for('index'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    app.run(debug=True, port=5000)
