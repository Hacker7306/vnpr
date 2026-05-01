const express = require("express");
const router  = express.Router();
const Scan    = require("../models/Scan");

// ── GET /api/scans  (paginated, searchable) ──────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(100, parseInt(req.query.limit) || 20);
    const skip    = (page - 1) * limit;

    const filter  = {};
    if (req.query.search) {
      filter.plateNumber = { $regex: req.query.search.toUpperCase(), $options: "i" };
    }
    if (req.query.vehicleType && req.query.vehicleType !== "all") {
      filter.vehicleType = req.query.vehicleType;
    }
    if (req.query.minConf) {
      filter.confidence = { $gte: parseFloat(req.query.minConf) };
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo)   filter.createdAt.$lte = new Date(req.query.dateTo + "T23:59:59Z");
    }

    const [scans, total] = await Promise.all([
      Scan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Scan.countDocuments(filter),
    ]);

    res.json({ scans, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/scans/export  (CSV download) ────────────────────────────────────
router.get("/export", async (req, res) => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 }).limit(5000).lean();

    const header = "Plate Number,Vehicle Type,Confidence,Location,Date,Time\n";
    const rows = scans
      .map((s) => {
        const d = new Date(s.createdAt);
        return [
          s.plateNumber,
          s.vehicleType,
          (s.confidence * 100).toFixed(1) + "%",
          s.location || "",
          d.toLocaleDateString(),
          d.toLocaleTimeString(),
        ].join(",");
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="snapplate_export.csv"');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/scans  (save a scan result) ────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { plateNumber, confidence, vehicleType, imageData, location, notes } = req.body;
    if (!plateNumber) return res.status(400).json({ error: "plateNumber is required" });

    const scan = await Scan.create({ plateNumber, confidence, vehicleType, imageData, location, notes });
    res.status(201).json(scan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/scans/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Scan.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
