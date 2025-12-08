// controllers/customerController.js
const Customer = require('../models/Customer');

exports.createCustomer = async (req, res) => {
  try {
    console.log('📦 Body received:', req.body); // Debug

    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    console.error('❌ Error creating customer:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
