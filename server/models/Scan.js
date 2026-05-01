const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, uppercase: true, trim: true },
    confidence:  { type: Number, required: true, min: 0, max: 1 },
    vehicleType: { type: String, default: "Unknown" },
    imageData:   { type: String }, // base64 data-url of the uploaded image
    location:    { type: String, default: "" },
    notes:       { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for common queries
scanSchema.index({ plateNumber: 1 });
scanSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
