import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import BatteryManagement from './pages/BatteryManagement';
import Firmware from './pages/Firmware';
import Digitaltwinmonitor from './pages/Digitaltwinmonitor';
import Securecenter from './pages/Securecenter';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/battery" element={<BatteryManagement />} />
            <Route path="/firmware" element={<Firmware />} />
            <Route path="/digital-twin" element={<Digitaltwinmonitor />} />
            <Route path="/security" element={<Securecenter />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;