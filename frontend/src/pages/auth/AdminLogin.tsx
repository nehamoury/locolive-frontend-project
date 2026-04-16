import React, { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: 'admin@locolive.com', password: 'password123' });
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/users/login', formData);
      const { access_token, user } = response.data;
      
      if (user.role !== 'admin' && user.role !== 'moderator') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      login(access_token, user);
      // AuthProvider will handle navigation to /admin or dashboard via App.tsx logic
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Authentication failed.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden font-sans py-12 px-4 selection:bg-primary/30">
      
      {/* Admin Specific Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] p-8 md:p-12 rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Admin Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center border border-white/10 mb-6 shadow-2xl">
            <Lock className="w-8 h-8 text-white/90" />
          </div>
          <h1 className="text-xl font-black text-white tracking-[0.3em] uppercase mb-2">Command Center</h1>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>

        {/* Status Section */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Administrator Access</h2>
          <p className="text-gray-500 text-sm">Secure authorization required to access system controls</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Admin Identity</label>
            <Input
              placeholder="admin@locolive.app"
              type="email"
              required
              className="h-14 bg-white/[0.03] border-white/5 text-white placeholder:text-gray-600 focus:border-primary/50 rounded-2xl"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Security Token</label>
            <div className="relative">
              <Input
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                className="h-14 bg-white/[0.03] border-white/5 text-white placeholder:text-gray-600 focus:border-primary/50 rounded-2xl"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] rounded-2xl mt-4 bg-primary hover:bg-[#e0005f] text-white transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Establish Session"}
          </Button>

          {/* Simple Back to Public Link */}
          <div className="pt-6 text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 mx-auto group"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              Return to Public Portal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
