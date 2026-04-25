import { type FC } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/helpers';

const AppearanceSection: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Appearance</h2>
        <p className="text-[14px] text-text-muted font-bold">Customize how Locolive looks on your device</p>
      </div>

      <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-8">
          <h3 className="text-[15px] font-black text-text-base mb-6">Choose Theme</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => theme === 'dark' && toggleTheme()}
              className={cn(
                "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all cursor-pointer",
                theme === 'light' ? "border-pink-500 bg-pink-50/30" : "border-border-base hover:border-pink-200"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                <Sun className="w-6 h-6" />
              </div>
              <span className="font-black text-[13px] uppercase tracking-wider">Light Mode</span>
            </button>
            <button 
              onClick={() => theme === 'light' && toggleTheme()}
              className={cn(
                "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all cursor-pointer",
                theme === 'dark' ? "border-pink-500 bg-pink-50/30" : "border-border-base hover:border-pink-200"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 shadow-sm flex items-center justify-center text-pink-500">
                <Moon className="w-6 h-6" />
              </div>
              <span className="font-black text-[13px] uppercase tracking-wider">Dark Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
