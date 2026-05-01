const express = require("express");
const router  = express.Router();
const Scan    = require("../models/Scan");

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const now       = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, todayCount, allScans, vehicleTypes] = await Promise.all([
      Scan.countDocuments(),
      Scan.countDocuments({ createdAt: { $gte: startOfDay } }),
      Scan.find({}, "plateNumber confidence createdAt").sort({ createdAt: -1 }).limit(1000).lean(),
      Scan.aggregate([
        { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const uniquePlates  = new Set(allScans.map((s) => s.plateNumber)).size;
    const avgConfidence = allScans.length
      ? allScans.reduce((acc, s) => acc + s.confidence, 0) / allScans.length
      : 0;

    // Last 7 days scan counts
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const count = allScans.filter(
        (s) => new Date(s.createdAt) >= dayStart && new Date(s.createdAt) < dayEnd
      ).length;
      last7.push({ date: dayStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), count });
    }

    res.json({
      total,
      todayCount,
      uniquePlates,
      avgConfidence: parseFloat(avgConfidence.toFixed(2)),
      vehicleTypes,
      last7,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
