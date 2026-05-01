import { type FC } from 'react';
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils/helpers';

const AppearanceSection: FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { queries, mutations } = useSettings();

  const handleLanguageChange = (lang: string) => {
    if (lang !== 'en') return; // Only English for now
    mutations.updatePreferences.mutate({
      ...queries.preferences.data,
      language: lang,
      theme: theme, // Sync with current theme
      content_filter_enabled: queries.preferences.data?.content_filter_enabled ?? true
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Appearance & Language</h2>
        <p className="text-[14px] text-text-muted font-bold">Customize how Locolive looks and feels</p>
      </div>

      <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-8 space-y-10">
          
          {/* Compact Theme Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shrink-0">
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-base leading-none mb-1">App Theme</h3>
                <p className="text-[12px] text-text-muted font-bold leading-tight">Switch between light and dark mode</p>
              </div>
            </div>

            <div className="flex bg-bg-base/80 p-1 rounded-2xl border border-border-base/30 w-full sm:w-auto">
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all",
                  theme === 'light' ? "bg-bg-card shadow-sm text-pink-500" : "text-text-muted hover:text-text-base"
                )}
              >
                <Sun className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Light</span>
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all",
                  theme === 'dark' ? "bg-bg-card shadow-sm text-pink-500" : "text-text-muted hover:text-text-base"
                )}
              >
                <Moon className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Dark</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-border-base/30" />

          {/* Language Selection as Dropdown */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-text-base">App Language</h3>
                <p className="text-[12px] text-text-muted font-bold">Choose your preferred language</p>
              </div>
            </div>
            
            <div className="relative max-w-sm">
              <select 
                value={queries.preferences.data?.language || 'en'}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-6 py-4 text-[13px] font-black text-text-base appearance-none outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="en">English (US)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
