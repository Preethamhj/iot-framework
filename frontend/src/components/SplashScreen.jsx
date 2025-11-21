import { Activity } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 animate-fade-out">
      <div className="animate-bounce mb-4">
        <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Activity className="w-12 h-12 text-white" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white tracking-wider animate-pulse">
        IoT Edge Optimizer
      </h1>
      <p className="text-emerald-400 mt-2 text-sm font-mono">Initializing System...</p>
    </div>
  );
};

export default SplashScreen;