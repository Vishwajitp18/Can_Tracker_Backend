// controllers/canController.js
const Can = require('../models/Can');

// GET /api/cans  → list all cans
exports.getCans = async (req, res) => {
  try {
    const cans = await Can.find().populate('currentCustomer');
    res.json(cans);
  } catch (err) {
    console.error('❌ getCans error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cans  → create a can manually (optional, mostly for testing)
exports.createCan = async (req, res) => {
  try {
    const { qrCode, fertilizerName } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'qrCode (Can ID) is required' });
    }

    const can = await Can.create({
      qrCode,
      fertilizerName: fertilizerName || undefined,
    });

    res.status(201).json(can);
  } catch (err) {
    console.error('❌ createCan error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// PATCH /api/cans/:id/lost  → mark can as lost
exports.markLost = async (req, res) => {
  try {
    const { id } = req.params;

    const can = await Can.findById(id);
    if (!can) {
      return res.status(404).json({ message: 'Can not found' });
    }

    // Already lost? just return it
    if (can.status === 'lost') {
      return res.json(can);
    }

    can.status = 'lost';
    can.currentCustomer = null;
    // optional: clear fertilizer if you want
    // can.fertilizerName = null;

    await can.save();

    res.json({
      message: `Can ${can.qrCode} marked as lost`,
      can,
    });
  } catch (err) {
    console.error('❌ markLost error:', err.message);
    res.status(400).json({ message: err.message });
  }
  // GET /api/cans/pending
router.get('/pending', async (req, res) => {
  try {
    const pendingCans = await Can.find({ status: "with_customer" })
      .populate("currentCustomer");
    res.json(pendingCans);
  } catch (err) {
    res.status(500).json({ message: "Error loading pending cans" });
  }
});

};
