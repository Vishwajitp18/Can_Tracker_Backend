const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    can: { type: mongoose.Schema.Types.ObjectId, ref: 'Can', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['issue', 'return'], required: true },
    fertilizerName: { type: String },
    amount: { type: Number, default: 0 },   // 👈 important
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
