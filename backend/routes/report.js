const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const TelemetryReport = require("../models/TelemetryReport");

// ----------------------------
// CONFIG
// ----------------------------
const SIMULATE_KYBER = true;

// ----------------------------
// DECRYPT FUNCTION
// ----------------------------
function decryptIncomingReport(packet) {
    try {
        console.log("🔓 Starting Hybrid Decryption Flow...");

        const kyberBlob = Buffer.from(packet.kyber_key_blob, "base64");
        const iv = Buffer.from(packet.iv, "base64");
        const tag = Buffer.from(packet.tag, "base64");
        const encryptedData = Buffer.from(packet.encrypted_data, "base64");

        let aesKey;

        if (SIMULATE_KYBER) {
            console.log("⚙ Using Kyber Simulation Mode");
            aesKey = kyberBlob.subarray(5, 37); // 32 bytes
        }

        const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const parsed = JSON.parse(decrypted.toString("utf8"));
        return parsed;

    } catch (err) {
        console.error("❌ Decryption failed:", err.message);
        return null;
    }
}

// ----------------------------
// POST /api/report
// ----------------------------
router.post("/report", async (req, res) => {
    try {
        const decrypted = decryptIncomingReport(req.body);

        if (!decrypted) {
            return res.status(400).json({
                success: false,
                message: "Decryption failed"
            });
        }

        // SAVE IN MONGODB
        const savedDoc = await TelemetryReport.create(decrypted);

        console.log("💾 Saved to MongoDB:", savedDoc.digitalTwin.deviceId);

        return res.json({
            success: true,
            message: "Report decrypted & stored",
            id: savedDoc._id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
