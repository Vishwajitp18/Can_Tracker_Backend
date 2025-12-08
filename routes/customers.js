// routes/customers.js
const express = require('express');
const router = express.Router();

// Import the Customer model
const Customer = require('../models/Customer');

// Create customer (POST /api/customers)
router.post('/', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error('Error creating customer:', err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Customer already exists with this phone number' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customers (GET /api/customers?search=...)
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const customers = await Customer.find(query).sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

module.exports = router;
