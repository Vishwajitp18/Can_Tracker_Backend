// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Indexes only for CUSTOMER
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
