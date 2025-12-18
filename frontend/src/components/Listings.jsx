import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const Listings = ({ shopId }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/listings/${shopId}/active`);
      setListings(response.data.map(l => ({ ...l, edit: { price: l.price.amount / l.price.divisor, quantity: l.quantity } })));
      setError(null);
    } catch (err) {
      setError('Impossibile caricare le inserzioni.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchListings();
    }
  }, [shopId]);

  const handleUpdate = async (listingId, editData) => {
    try {
      await axios.patch(`${API_BASE_URL}/listings/${shopId}/${listingId}`, editData);
      fetchListings();
    } catch (err) {
      alert(`Errore nell'aggiornare l'inserzione #${listingId}.`);
      console.error(err);
    }
  };

  const handleInputChange = (listingId, field, value) => {
    setListings(listings.map(l =>
      l.listing_id === listingId ? { ...l, edit: { ...l.edit, [field]: value } } : l
    ));
  };

  if (loading) return <p>Caricamento inserzioni...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Inserzioni Attive</h2>
      <table>
        <thead>
          <tr>
            <th>Immagine</th>
            <th>Titolo</th>
            <th>Quantità</th>
            <th>Prezzo</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.listing_id}>
              <td><img src={listing.images?.[0]?.url_75x75} alt={listing.title} /></td>
              <td>{listing.title}</td>
              <td>{listing.quantity}</td>
              <td>{`${listing.price.amount / listing.price.divisor} ${listing.price.currency_code}`}</td>
              <td>
                <div>
                  <input
                    type="number"
                    value={listing.edit.quantity}
                    onChange={(e) => handleInputChange(listing.listing_id, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={listing.edit.price}
                    onChange={(e) => handleInputChange(listing.listing_id, 'price', e.target.value)}
                  />
                  <button onClick={() => handleUpdate(listing.listing_id, listing.edit)}>
                    Aggiorna
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Listings;
