const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// Path to Arduino CLI
const ARDUINO_CLI = "E:\\ardinoide\\arduino-cli.exe";

// folders
const uploadFolder = path.join(process.cwd(), "firmware_uploads");
const binFolder = path.join(process.cwd(), "compiled_binaries");

if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(binFolder)) fs.mkdirSync(binFolder);

// CLEAN OLD FILES & FOLDERS
function cleanFolder(folder) {
  fs.readdirSync(folder).forEach(item => {
    const itemPath = path.join(folder, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
  });
}

// Receive firmware → save → compile → output bin
router.post("/code", (req, res) => {
  const { payload } = req.body;

  if (!payload) {
    return res.status(400).send("No payload received");
  }

  // Clean folders before writing new files
  cleanFolder(uploadFolder);
  cleanFolder(binFolder);

  const inoPath = path.join(uploadFolder, "firmware_uploads.ino");

  // Save file
  fs.writeFile(inoPath, payload, err => {
    if (err) {
      console.error("Write error:", err);
      return res.status(500).send("Failed to save .ino");
    }

    console.log("✔ Firmware saved. Starting compilation...");

    // Compile THIS FILE instead of folder
    const compileCmd = `"${ARDUINO_CLI}" compile --fqbn esp32:esp32:esp32s2 "${inoPath}" --output-dir "${binFolder}"`;

    exec(compileCmd, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Compile error:", stderr);
        return res.status(500).send(stderr);
      }

      console.log("✔ Compile success:\n", stdout);

      // Arduino CLI output file is:
      // binFolder/uploaded_firmware.ino.esp32s2.bin
      const compiledBin = path.join(binFolder, "firmware_uploads.ino.bin");

      if (!fs.existsSync(compiledBin)) {
        return res.status(500).send("Binary file not found after compile.");
      }

      // Rename as firmware.bin
      const finalBin = path.join(binFolder, "firmware.bin");

      fs.copyFile(compiledBin, finalBin, err => {
        if (err) {
          console.error("Move error:", err);
          return res.status(500).send("Failed to move binary");
        }

        res.json({
          success: true,
          message: "Firmware compiled successfully",
          bin: "firmware.bin",
          path: finalBin
        });
      });
    });
  });
});

module.exports = router;
