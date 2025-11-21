import { useTheme } from '../context/ThemeContext';

const BatteryManagement = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className="text-4xl font-bold">Battery Management</h1>
    </div>
  );
};

export default BatteryManagement;