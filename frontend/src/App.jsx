import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BatteryManagement from './pages/BatteryManagement';
import Firmware from './pages/Firmware';
import Digitaltwinmonitor from './pages/Digitaltwinmonitor';
import Securecenter from './pages/Securecenter';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Check for logged-in user on app load
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setIsAuthenticated(true);
    }
    
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
    localStorage.removeItem('currentUser');
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

            {/* Protected Routes */}
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
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;