require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const axios    = require("axios");
const FormData = require("form-data");
const upload   = require("./middleware/upload");
const Scan     = require("./models/Scan");

const app    = express();
const PORT   = process.env.PORT   || 5000;
const ML_URL = process.env.ML_URL || "http://localhost:8000";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "50mb" }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/snapplate";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/scans", require("./routes/scans"));
app.use("/api/stats", require("./routes/stats"));

// ── POST /api/process  (upload → Python OCR → save → return) ─────────────────
app.post("/api/process", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  try {
    // Forward image to the Python ML service
    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname || "upload.jpg",
      contentType: req.file.mimetype,
    });

    const mlRes = await axios.post(`${ML_URL}/api/ocr`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const { plateNumber, confidence, vehicleType } = mlRes.data;

    // Convert uploaded buffer to base64 data-url for storage
    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Save result to MongoDB
    const scan = await Scan.create({
      plateNumber,
      confidence,
      vehicleType,
      imageData,
      location: req.body.location || "",
    });

    return res.status(201).json(scan);
  } catch (err) {
    // If ML service is down return a descriptive error
    const mlDown = err.code === "ECONNREFUSED" || err.code === "ECONNABORTED";
    if (mlDown) {
      return res.status(503).json({
        error: "OCR service is offline. Start the Python Flask service on port 8000.",
      });
    }
    const msg = err.response?.data?.error || err.message;
    return res.status(500).json({ error: msg });
  }
});

// ── ML health proxy ───────────────────────────────────────────────────────────
app.get("/api/ml-health", async (_req, res) => {
  try {
    const r = await axios.get(`${ML_URL}/health`, { timeout: 4000 });
    res.json({ online: true, ...r.data });
  } catch {
    res.json({ online: false });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 SnapPlate Server  → http://localhost:${PORT}`);
  console.log(`🔬 ML service URL    → ${ML_URL}`);
});
