// routes/cans.js
const express = require('express');
const router = express.Router();
const Can = require('../models/Can');

const {
  getCans,
  createCan,
  markLost,
} = require('../controllers/canController');

// GET /api/cans/pending-count
router.get('/pending-count', async (req, res) => {
  try {
    const counts = await Can.aggregate([
      { $match: { status: "with_customer" } },
      { $group: { _id: "$currentCustomer", pending: { $sum: 1 } } }
    ]);

    res.json(counts);
  } catch (err) {
    console.error('Error loading pending counts', err);
    res.status(500).json({ message: 'Error loading pending counts' });
  }
});

// GET /api/cans
router.get('/', getCans);

// POST /api/cans   (optional manual can creation)
router.post('/', createCan);

// PATCH /api/cans/:id/lost
router.patch('/:id/lost', markLost);

module.exports = router;


