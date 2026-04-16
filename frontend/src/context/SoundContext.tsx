import { createContext, useContext, useState, useEffect } from 'react';

interface SoundContextType {
  isMuted: boolean; // For videos
  toggleMute: () => void;
  alertsEnabled: boolean; // For pings/notifications
  toggleAlerts: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const storedMuted = localStorage.getItem('soundMuted');
    if (storedMuted !== null) {
      setIsMuted(storedMuted === 'true');
    }
    const storedAlerts = localStorage.getItem('audio_enabled');
    if (storedAlerts !== null) {
      setAlertsEnabled(storedAlerts === 'true');
    }
  }, []);

  const toggleMute = () => {
    setIsMuted((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('soundMuted', String(newValue));
      return newValue;
    });
  };

  const toggleAlerts = () => {
    setAlertsEnabled((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('audio_enabled', String(newValue));
      
      // If we are disabling alerts, also mute videos for a consistent "Silent Mode"
      if (!newValue) {
        setIsMuted(true);
        localStorage.setItem('soundMuted', 'true');
      }
      
      return newValue;
    });
  };

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, alertsEnabled, toggleAlerts }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
