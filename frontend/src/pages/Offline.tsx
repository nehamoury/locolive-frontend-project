import { WifiOff, RefreshCw } from 'lucide-react';

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ff3b8e]/10 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-[#ff3b8e]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You are offline</h1>
        <p className="text-gray-400 mb-8">Showing last available data</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff3b8e] text-white font-bold rounded-full hover:bg-[#ff3b8e]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default Offline;