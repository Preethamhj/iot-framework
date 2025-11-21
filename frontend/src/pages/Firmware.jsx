import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../context/ThemeContext';

const MonacoArduinoEditor = ({ initialCode }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [model, setModel] = useState(null);
  const [logs, setLogs] = useState('');
  const [uploadedPayload, setUploadedPayload] = useState(null);

  const { isDarkMode } = useTheme();

  /** Auto theme */
  useEffect(() => {
    if (monaco && editorRef.current) {
      monaco.editor.setTheme(isDarkMode ? "vs-dark" : "vs-light");
    }
  }, [isDarkMode]);

  /** Init Monaco */
  useEffect(() => {
    if (!containerRef.current) return;

    const createdModel = monaco.editor.createModel(
      initialCode ||
        `#include <Arduino.h>

void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println("hello");
  delay(1000);
}
`,
      "cpp"
    );

    const editor = monaco.editor.create(containerRef.current, {
      model: createdModel,
      language: "cpp",
      theme: isDarkMode ? "vs-dark" : "vs-light",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
    });

    editorRef.current = editor;
    setModel(createdModel);

    return () => {
      createdModel.dispose();
      editor.dispose();
    };
  }, []);

  /** ---- Upload (Save only) ---- */
  const handleUpload = () => {
    if (!model) return;

    const code = model.getValue();

    const wrapped = {
      payload: code
    };

    setUploadedPayload(wrapped);
    setLogs("Payload saved. Ready to compile.\n");
  };

  /** ---- Compile (Send to backend) ---- */
  const handleCompile = async () => {
    if (!uploadedPayload) {
      setLogs(prev => prev + "\n❌ No payload uploaded!");
      return;
    }

    setLogs(prev => prev + "⏳ Sending to backend...\n");

    try {
      const res = await fetch("http://localhost:3000/code/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadedPayload)
      });

      const msg = await res.text();
      setLogs(prev => prev + "✔ Backend: " + msg + "\n");
    } catch (err) {
      setLogs(prev => prev + "❌ Error: " + err.message + "\n");
    }
  };

  return (
    <div className="p-4 space-y-3">
      
      {/* Buttons */}
      <div className="flex items-center gap-3">

        {/* Upload button */}
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload Firmware
        </button>

        {/* Compile button */}
        <button
          onClick={handleCompile}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Compile Firmware
        </button>

      </div>

      {/* Monaco Editor */}
      <div
        ref={containerRef}
        style={{ height: 480 }}
        className="border rounded"
      />

      {/* Logs */}
      <div className="mt-2">
        <div className="font-semibold">Log</div>
        <pre className="bg-black/60 text-sm p-2 rounded max-h-40 overflow-auto text-white">
          {logs}
        </pre>
      </div>

    </div>
  );
};

export default function Firmware() {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`p-6 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      <h1 className="text-3xl font-bold mb-4">Firmware Editor</h1>
      <MonacoArduinoEditor />
    </div>
  );
}
