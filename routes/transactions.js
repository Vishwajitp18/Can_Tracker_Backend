// routes/transactions.js
const express = require('express');
const router = express.Router();

// IMPORT MODELS
const Transaction = require('../models/Transaction');
const Can = require('../models/Can');

// POST /api/transactions/issue-by-qr
router.post('/issue-by-qr', async (req, res) => {
  try {
    const { customerId, qrCode, fertilizerName, amount } = req.body;

    if (!customerId || !qrCode) {
      return res
        .status(400)
        .json({ message: 'customerId and canId (qrCode) are required' });
    }

    // 1) Try to find existing can by its ID (we store it in qrCode field)
    let can = await Can.findOne({ qrCode });

    // 2) If not found, CREATE a new can with this Can ID
    if (!can) {
      can = await Can.create({
        qrCode, // this is your Can ID, e.g. "CAN001"
        status: 'with_customer',
        currentCustomer: customerId,
        fertilizerName: fertilizerName || '',
      });
    } else {
      // 3) If found but already with some customer, block issuing again
      if (can.status === 'with_customer') {
        return res
          .status(400)
          .json({ message: 'This can is already issued to a customer' });
      }

      // mark as with_customer and update fields
      can.status = 'with_customer';
      can.currentCustomer = customerId;
      if (fertilizerName) {
        can.fertilizerName = fertilizerName;
      }
      await can.save();
    }

    // 4) Create transaction with amount
    const tx = await Transaction.create({
      can: can._id,
      customer: customerId,
      type: 'issue',
      fertilizerName: fertilizerName || '',
      amount: typeof amount === 'number' ? amount : Number(amount) || 0,
    });

    return res.status(201).json(tx);
  } catch (err) {
    console.error('Error issuing can', err);
    return res.status(500).json({ message: 'Error issuing can' });
  }
});

// POST /api/transactions/return-by-qr
router.post('/return-by-qr', async (req, res) => {
  try {
    const { customerId, qrCode } = req.body;

    if (!customerId || !qrCode) {
      return res
        .status(400)
        .json({ message: 'customerId and canId (qrCode) are required' });
    }

    // 1) Find can by Can ID
    const can = await Can.findOne({ qrCode });
    if (!can) {
      return res
        .status(404)
        .json({ message: 'Can not found for this Can ID' });
    }

    // 2) Check if that can is with this customer
    if (
      can.status !== 'with_customer' ||
      !can.currentCustomer ||
      can.currentCustomer.toString() !== customerId
    ) {
      return res.status(400).json({
        message: 'This can is not currently issued to this customer',
      });
    }

    // 3) Update can -> mark as available
    can.status = 'available';
    can.currentCustomer = null;
    await can.save();

    // 4) Create transaction for return, amount = 0
    const tx = await Transaction.create({
      can: can._id,
      customer: customerId,
      type: 'return',
      amount: 0,
    });

    return res.status(201).json(tx);
  } catch (err) {
    console.error('Error returning can', err);
    return res.status(500).json({ message: 'Error returning can' });
  }
});

// GET /api/transactions  (history)
router.get('/', async (req, res) => {
  try {
    const txs = await Transaction.find({})
      .populate('customer')
      .populate('can')
      .sort({ createdAt: -1 });

    res.json(txs);
  } catch (err) {
    console.error('Error fetching transactions', err);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// ⭐ NEW: GET /api/transactions/overdue  -> cans not returned after 10 days
router.get('/overdue', async (req, res) => {
  try {
    const days = Number(req.query.days) || 10; // default 10 days
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1) Find issue transactions older than cutoff
    const issues = await Transaction.find({
      type: 'issue',
      createdAt: { $lte: cutoff },
    })
      .populate('customer')
      .populate('can')
      .sort({ createdAt: -1 });

    // 2) Keep only those where can is still with customer
    const overdue = issues.filter(
      (tx) => tx.can && tx.can.status === 'with_customer'
    );

    res.json(overdue);
  } catch (err) {
    console.error('Error fetching overdue transactions', err);
    res.status(500).json({ message: 'Error fetching overdue transactions' });
  }
});

module.exports = router;
