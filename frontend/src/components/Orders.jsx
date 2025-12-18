import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const Orders = ({ shopId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders/${shopId}/open`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare gli ordini.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchOrders();
    }
  }, [shopId]);

  const handleMarkAsShipped = async (receiptId) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${shopId}/${receiptId}/ship`);
      fetchOrders();
    } catch (err) {
      alert(`Errore nell'aggiornare l'ordine #${receiptId}.`);
      console.error(err);
    }
  };

  if (loading) return <p>Caricamento ordini...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Ordini da Spedire</h2>
      {orders.length === 0 ? (
        <p>Nessun ordine da spedire al momento!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID Ordine</th>
              <th>Acquirente</th>
              <th>Totale</th>
              <th>Data</th>
              <th>Azione</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.receipt_id}>
                <td>{order.receipt_id}</td>
                <td>{order.name}</td>
                <td>{`${order.grandtotal.amount / order.grandtotal.divisor} ${order.grandtotal.currency_code}`}</td>
                <td>{new Date(order.created_timestamp * 1000).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleMarkAsShipped(order.receipt_id)}>
                    Segna come Spedito
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Orders;
