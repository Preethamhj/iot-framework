import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../context/ThemeContext';
import { Code } from 'lucide-react'; // Added Code icon

// --- Monaco Editor Component (Unchanged Logic) ---

const MonacoArduinoEditor = ({ initialCode }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [model, setModel] = useState(null);
  const [logs, setLogs] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const { isDarkMode } = useTheme();

  /** Auto apply dark/light theme */
  useEffect(() => {
    if (monaco && editorRef.current) {
      monaco.editor.setTheme(isDarkMode ? "vs-dark" : "vs-light");
    }
  }, [isDarkMode]);

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
  delay(1000)
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
    setMonacoInstance(monaco);

    return () => {
      createdModel.dispose();
      editor.dispose();
    };
  }, []);

  /** Severity map */
  function mapSeverity(s) {
    if (s === 1) return monaco.MarkerSeverity.Error;
    if (s === 2) return monaco.MarkerSeverity.Warning;
    return monaco.MarkerSeverity.Info;
  }

  /** Fallback parser (Omitted for brevity, logic remains) */
  function parseGccOutputToMarkers(output) {
     const markers = [];
     const lines = output.split("\n");
     const re = /(?:[^:\n]+):(\d+):(\d+):\s*(error|warning|note):\s*(.*)$/i;

     for (const l of lines) {
       const m = l.match(re);
       if (m) {
         const line = parseInt(m[1]) - 1;
         const col = parseInt(m[2]);
         const sev = /error/i.test(m[3]) ? 1 : /warning/i.test(m[3]) ? 2 : 3;

         markers.push({
           startLineNumber: line + 1,
           startColumn: col,
           endLineNumber: line + 1,
           endColumn: col + 1,
           message: m[4],
           severity: mapSeverity(sev),
         });
       }
     }
     return markers;
  }


  /** Syntax check button (Logic remains, API call placeholder) */
  async function checkDiagnostics() {
    if (!model) return;
    setIsChecking(true);
    setLogs("Checking...");

    const code = model.getValue();

    try {
      // NOTE: This API call placeholder needs a real backend endpoint.
      const resp = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "arduino" }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setLogs(`Diagnostics API returned ${resp.status}: ${txt}`);
      } else {
        const j = await resp.json();

        if (j && Array.isArray(j.errors)) {
          const markers = j.errors.map((e) => ({
            startLineNumber: e.line,
            startColumn: e.column || 1,
            endLineNumber: e.line,
            endColumn: (e.column || 1) + (e.length || 1),
            message: e.message,
            severity: mapSeverity(e.severity || 1),
          }));

          monaco.editor.setModelMarkers(model, "arduino-diagnostics", markers);
          setLogs(`Found ${markers.length} problems (from backend).`);
          setIsChecking(false);
          return;
        }
      }
    } catch (err) {
      setLogs("Backend diagnostics failed: " + err.message);
    }

    /** fallback simple parsing */
    const fallbackMarkers = [];
    const srcLines = code.split("\n");

    for (let i = 0; i < srcLines.length; i++) {
      const trimmed = srcLines[i].trim();
      if (!trimmed) continue;

      if (
        /\)\s*$/.test(trimmed) ||
        /\bSerial\.print/.test(trimmed) ||
        /\bdelay\s*\(/.test(trimmed)
      ) {
        if (!/[;{}]$/.test(trimmed)) {
          fallbackMarkers.push({
            startLineNumber: i + 1,
            startColumn: 1,
            endLineNumber: i + 1,
            endColumn: srcLines[i].length,
            message: "Possible missing semicolon",
            severity: monaco.MarkerSeverity.Error,
          });
        }
      }
    }

    monaco.editor.setModelMarkers(model, "arduino-diagnostics", fallbackMarkers);
    setLogs(`Fallback found ${fallbackMarkers.length} issues.`);
    setIsChecking(false);
  }

  function clearDiagnostics() {
    if (model) {
      monaco.editor.setModelMarkers(model, "arduino-diagnostics", []);
      setLogs("Cleared diagnostics.");
    }
  }

  /** File Upload Handler */
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      model.setValue(text);
      setLogs(`Loaded file: ${file.name}`);
    };

    reader.readAsText(file);
  }

  return (
    <div className="p-4 space-y-3">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <label className="px-4 py-2 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700">
          Upload Firmware
          <input
            type="file"
            accept=".ino,.cpp,.h,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={checkDiagnostics}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Check Syntax"}
        </button>

        <button
          className="px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          onClick={clearDiagnostics}
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        style={{ height: 480 }}
        className="border rounded"
      />

      {/* Logs */}
      <div className="mt-2">
        <div className="font-semibold">Compiler / Diagnostics Log</div>
        <pre className="bg-black/60 text-sm p-2 rounded max-h-40 overflow-auto text-white">
          {logs}
        </pre>
      </div>
    </div>
  );
};

// --- Firmware Page Component (Header Fixed) ---

export default function Firmware() {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`p-6 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      {/* FIX APPLIED: Added gradient styles to match the theme */}
      <div className="w-fit mb-6">
        <h1 
            className="text-4xl font-extrabold"
            style={{ 
                // Digital Twin Theme Gradient: Green to Cyan/Blue
                background: isDarkMode ? 'linear-gradient(90deg, #10B981, #06B6D4)' : 'linear-gradient(90deg, #059669, #0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block' 
            }}
        >
            <Code className='inline-block align-text-bottom mr-2 w-7 h-7' />
            Firmware Editor
        </h1>
      </div>
      
      <MonacoArduinoEditor />
    </div>
  );
}