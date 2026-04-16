import { useState } from 'react';
import { Save, RotateCcw, MapPin, Film, Route, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi, { type AppSettings } from '../../services/adminApi';
import { toast } from 'react-hot-toast';

export function Settings() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

  const saveMutation = useMutation({
    mutationFn: (newSettings: Partial<AppSettings>) => adminApi.updateSettings(newSettings),
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const currentSettings = localSettings || settings;

  const handleChange = (key: keyof AppSettings, value: number | boolean) => {
    if (!localSettings && settings) {
      setLocalSettings({ ...settings });
    }
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = () => {
    if (localSettings) {
      saveMutation.mutate(localSettings);
    }
  };

  const handleReset = () => {
    setLocalSettings(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#FF006E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!localSettings || saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF006E] to-[#833AB4] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#FF006E]" />
            Location Settings
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Discovery Radius (km)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={currentSettings?.discovery_radius || 5}
                  onChange={(e) => handleChange('discovery_radius', parseInt(e.target.value))}
                  className="flex-1 accent-[#FF006E]"
                />
                <span className="w-12 text-center font-medium text-gray-900">{currentSettings?.discovery_radius || 5}km</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Crossing Distance (meters)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={currentSettings?.crossing_distance || 50}
                  onChange={(e) => handleChange('crossing_distance', parseInt(e.target.value))}
                  className="flex-1 accent-[#FF006E]"
                />
                <span className="w-12 text-center font-medium text-gray-900">{currentSettings?.crossing_distance || 50}m</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location Update Interval (seconds)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={currentSettings?.location_update_seconds || 30}
                  onChange={(e) => handleChange('location_update_seconds', parseInt(e.target.value))}
                  className="flex-1 accent-[#FF006E]"
                />
                <span className="w-12 text-center font-medium text-gray-900">{currentSettings?.location_update_seconds || 30}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Toggles</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Film className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reels</p>
                  <p className="text-sm text-gray-500">Enable/disable reels feature</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('reels_enabled', !currentSettings?.reels_enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  currentSettings?.reels_enabled ? 'bg-[#FF006E]' : 'bg-gray-300'
                }`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                  currentSettings?.reels_enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Route className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Crossings</p>
                  <p className="text-sm text-gray-500">Enable/disable crossing detection</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('crossings_enabled', !currentSettings?.crossings_enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  currentSettings?.crossings_enabled ? 'bg-[#FF006E]' : 'bg-gray-300'
                }`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                  currentSettings?.crossings_enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">App Information</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-gray-900">{currentSettings?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Build</span>
              <span className="font-medium text-gray-900">{currentSettings?.build_date || '2024.01.15'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">API Version</span>
              <span className="font-medium text-gray-900">v1</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Environment</span>
              <span className="font-medium text-green-600 capitalize">{currentSettings?.environment || 'production'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
