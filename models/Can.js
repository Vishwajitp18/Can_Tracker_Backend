// models/Can.js
const mongoose = require('mongoose');

const canSchema = new mongoose.Schema(
  {
    qrCode: { type: String, required: true, unique: true }, // your Can ID
    status: { type: String, default: 'available' },         // 'available' | 'with_customer'
    currentCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    fertilizerName: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Indexes only for CAN
canSchema.index({ qrCode: 1 }, { unique: true });   // fast lookup by can ID
canSchema.index({ status: 1 });                     // fast filter by available/with_customer
canSchema.index({ currentCustomer: 1 });            // fast "who has which cans?"

module.exports = mongoose.model('Can', canSchema);
