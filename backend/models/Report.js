// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, required: true },
  reasoning: { type: String, required: true },
  metrics: {
    anomaly_score: Number,
    battery_prediction_hours: Number
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Report", reportSchema);
