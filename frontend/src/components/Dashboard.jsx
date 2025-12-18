import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const Dashboard = ({ shopId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/shop/${shopId}/stats`);
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Impossibile caricare le statistiche del negozio.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [shopId]);

  if (loading) {
    return <p>Caricamento statistiche...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Dashboard per: {stats.shopName}</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Inserzioni Attive</h3>
          <p>{stats.activeListings}</p>
        </div>
        <div>
          <h3>Vendite Totali</h3>
          <p>{stats.totalSales}</p>
        </div>
        <div>
          <h3>Recensioni</h3>
          <p>{stats.reviewCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
