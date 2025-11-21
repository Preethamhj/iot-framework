import { useState } from "react";
import { Menu, Home, Settings, BarChart2, Bell } from "lucide-react";

export default function Dashboard() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white shadow-xl h-full p-4 transition-all duration-300 ${open ? "w-64" : "w-20"}`}>
        <button onClick={() => setOpen(!open)} className="mb-6">
          <Menu />
        </button>

        <ul className="space-y-4">
          <li className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
            <Home /> {open && <span>Dashboard</span>}
          </li>
          <li className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
            <BarChart2 /> {open && <span>Analytics</span>}
          </li>
          <li className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
            <Bell /> {open && <span>Notifications</span>}
          </li>
          <li className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
            <Settings /> {open && <span>Settings</span>}
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-3xl font-bold">1,248</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Revenue</h2>
            <p className="text-3xl font-bold">$8,920</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Active Devices</h2>
            <p className="text-3xl font-bold">432</p>
          </div>
        </div>

        <div className="mt-10 bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Activity Chart</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
      </main>
    </div>
  );
}