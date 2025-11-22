const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Path to your binary file
const firmwarePath = path.join(__dirname, "../compiled_binaries/firmware.bin");

router.get("/firmware/latest", (req, res) => {
    if (!fs.existsSync(firmwarePath)) {
        return res.status(404).json({ error: "Firmware file not found" });
    }

    res.download(firmwarePath, "firmware.bin", (err) => {
        if (err) {
            console.error("Error sending firmware:", err);
            res.status(500).send("Failed to send firmware");
        }
    });
});

module.exports = router;
