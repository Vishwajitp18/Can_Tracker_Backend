// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Debug log
app.use((req, res, next) => {
  console.log('➡ Request:', req.method, req.url);
  next();
});

// Connect DB
connectDB();

// 🔴 VERY IMPORTANT: body parser BEFORE routes
app.use(cors());
app.use(express.json()); // <= this must be before app.use('/api/...')

app.use(morgan('dev'));

// Test route
app.get('/', (req, res) => {
  res.send('Fertilizer Can Tracker API running ✅');
});

const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/cans', require('./routes/cans'));
app.use('/api/transactions', require('./routes/transactions'));



const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
