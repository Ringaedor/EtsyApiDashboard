require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Ciao! Il server API di Etsy Manager è in esecuzione.');
});

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const orderRoutes = require('./routes/orders');
const listingRoutes = require('./routes/listings');
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/listings', listingRoutes);

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
