import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import Orders from './components/Orders.jsx';
import Listings from './components/Listings.jsx';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api';

function AppLayout({ handleLogout }) {
  return (
    <div>
      <header className="App-header">
        <h1>Etsy Shop Manager</h1>
        <nav>
          <Link to="/">Dashboard</Link> | <Link to="/orders">Ordini</Link> | <Link to="/listings">Inserzioni</Link>
          <button onClick={handleLogout} style={{ marginLeft: '20px' }}>Logout</button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function LoginPage({ handleLogin }) {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Etsy Shop Manager</h1>
        <div>
          <p>Collega il tuo account Etsy per iniziare.</p>
          <button onClick={handleLogin}>Login with Etsy</button>
        </div>
      </header>
    </div>
  );
}

function App() {
  const [shopId, setShopId] = useState(() => localStorage.getItem('etsyShopId'));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successShopId = urlParams.get('shop_id');

    if (successShopId) {
      setShopId(successShopId);
      localStorage.setItem('etsyShopId', successShopId);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/etsy`;
  };

  const handleLogout = () => {
    setShopId(null);
    localStorage.removeItem('etsyShopId');
  };

  return (
    <Router>
      <Routes>
        {shopId ? (
          <Route path="/" element={<AppLayout handleLogout={handleLogout} />}>
            <Route index element={<Dashboard shopId={shopId} />} />
            <Route path="orders" element={<Orders shopId={shopId} />} />
            <Route path="listings" element={<Listings shopId={shopId} />} />
          </Route>
        ) : (
          <Route path="*" element={<LoginPage handleLogin={handleLogin} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
