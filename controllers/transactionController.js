// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Can = require('../models/Can');

// Create transaction (generic, if you ever use it directly)
exports.createTransaction = async (req, res) => {
  try {
    const { customer, can, type, fertilizerName } = req.body;

    const tx = await Transaction.create({ customer, can, type, fertilizerName });

    const update = {};
    if (type === 'issue') {
      update.status = 'with_customer';
      update.currentCustomer = customer;
      if (fertilizerName) {
        update.fertilizerName = fertilizerName;
      }
    } else if (type === 'return') {
      update.status = 'returned';
      update.currentCustomer = null;
    }

    await Can.findByIdAndUpdate(can, update);

    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find()
      .populate('customer')
      .populate('can');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ⭐ Issue by Can ID (qrCode field)
exports.issueByQr = async (req, res) => {
  try {
    const { customerId, qrCode, fertilizerName } = req.body;

    if (!customerId || !qrCode) {
      return res
        .status(400)
        .json({ message: 'customerId and qrCode are required' });
    }

    if (!fertilizerName || !fertilizerName.trim()) {
      return res
        .status(400)
        .json({ message: 'fertilizerName is required when issuing a can' });
    }

    let can = await Can.findOne({ qrCode });

    // If can does NOT exist, create it now
    if (!can) {
      can = new Can({
        qrCode,
        status: 'with_customer',
        currentCustomer: customerId,
        fertilizerName: fertilizerName.trim(),
      });
      await can.save();
    } else {
      // If it exists AND is already with some other customer, block it
      if (
        can.status === 'with_customer' &&
        String(can.currentCustomer) !== String(customerId)
      ) {
        return res
          .status(400)
          .json({ message: 'Can is already issued to another customer' });
      }

      // Otherwise, mark it as with this customer and update fertilizer
      can.status = 'with_customer';
      can.currentCustomer = customerId;
      can.fertilizerName = fertilizerName.trim();
      await can.save();
    }

    // Create transaction record
    const tx = await Transaction.create({
      customer: customerId,
      can: can._id,
      type: 'issue',
      fertilizerName: fertilizerName.trim(),
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// ⭐ Return by Can ID (qrCode field)
exports.returnByQr = async (req, res) => {
  try {
    const { customerId, qrCode } = req.body;

    if (!customerId || !qrCode) {
      return res
        .status(400)
        .json({ message: 'customerId and qrCode are required' });
    }

    const can = await Can.findOne({ qrCode });
    if (!can) {
      return res
        .status(404)
        .json({ message: 'Can not found for this QR code' });
    }

    if (String(can.currentCustomer) !== String(customerId)) {
      return res
        .status(400)
        .json({ message: 'This can is not currently with this customer' });
    }

    const tx = await Transaction.create({
      customer: customerId,
      can: can._id,
      type: 'return',
      fertilizerName: can.fertilizerName || 'Unknown',
    });

    can.status = 'returned';
    can.currentCustomer = null;
    await can.save();

    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
