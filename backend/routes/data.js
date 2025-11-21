const router = require("express").Router();
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const logFilePath = path.join(__dirname, "device_logs.json");
// API to receive logs
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, JSON.stringify([]));
}
router.post("/logs", (req, res) => {
    const logData = req.body;

    console.log("\n===== NEW LOG RECEIVED =====");
    console.log(logData);

    // Read existing logs
    let logs = JSON.parse(fs.readFileSync(logFilePath, "utf8"));

    // Add timestamp server-side
    logData.serverTimestamp = new Date().toISOString();

    // Append log
    logs.push(logData);

    // Save back to file
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));

    res.json({
        status: "success",
        message: "Log stored successfully"
    });
});

module.exports = router;