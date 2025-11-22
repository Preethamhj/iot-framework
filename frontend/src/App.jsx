// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BatteryManagement from "./pages/BatteryManagement";
import Firmware from "./pages/Firmware";
import Digitaltwinmonitor from "./pages/Digitaltwinmonitor";
import Securecenter from "./pages/Securecenter";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./context/ThemeContext";
import ModelViewer from "./components/ModelViewer";

/*
  ModelPage Component
  - Helper component for the /model route to preview 3D assets
*/
function ModelPage() {
  const [color, setColor] = useState("#ff6666");
  const [mode, setMode] = useState("tint"); // "tint" or "replace"
  const [keepTextures, setKeepTextures] = useState(true);
  const modelUrl = "/models/model.glb"; // put your model at public/models/model.glb

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">3D Model Preview</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span>Choose color:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 p-0 border rounded"
          />
        </label>

        <label className="flex items-center gap-2">
          <span>Mode:</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-1 border rounded">
            <option value="tint">Tint (keep maps)</option>
            <option value="replace">Replace (flat color)</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={keepTextures}
            onChange={(e) => setKeepTextures(e.target.checked)}
          />
          <span>Keep textures (only for tint)</span>
        </label>
      </div>

      <div style={{ width: "100%", height: "600px", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <ModelViewer
          modelUrl={modelUrl}
          color={color}
          mode={mode}
          keepTextures={keepTextures}
        />
      </div>

      <div className="text-sm text-gray-500 mt-2">
        Tip: if color change is weak, try mode="replace" or uncheck "Keep textures".
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Check for logged-in user on app load
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem("currentUser");
      if (user) {
        try {
          // Try parsing the user to ensure it's valid JSON data
          const parsedUser = JSON.parse(user);
          if (parsedUser && typeof parsedUser === 'object') {
            setIsAuthenticated(true);
          } else {
            throw new Error("Invalid user data");
          }
        } catch (error) {
          // If parsing fails, clear the corrupt data and force login
          console.warn("Auth check failed, clearing session:", error);
          localStorage.removeItem("currentUser");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Handle Login (passed to Login page)
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Handle Logout (passed to Navbar)
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen">
          {/* Only show Navbar if authenticated */}
          {isAuthenticated && <Navbar onLogout={handleLogout} />}

          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/signup"
              element={!isAuthenticated ? <Signup /> : <Navigate to="/" />}
            />

            {/* Protected Routes - Wrapped in checks */}
            <Route
              path="/"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/battery"
              element={isAuthenticated ? <BatteryManagement /> : <Navigate to="/login" />}
            />
            <Route
              path="/firmware"
              element={isAuthenticated ? <Firmware /> : <Navigate to="/login" />}
            />
            <Route
              path="/digital-twin"
              element={isAuthenticated ? <Digitaltwinmonitor /> : <Navigate to="/login" />}
            />
            <Route
              path="/security"
              element={isAuthenticated ? <Securecenter /> : <Navigate to="/login" />}
            />

            {/* NEW: Model preview page (protected) */}
            <Route
              path="/model"
              element={isAuthenticated ? <ModelPage /> : <Navigate to="/login" />}
            />

            {/* Fallback: Catch-all redirect */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;