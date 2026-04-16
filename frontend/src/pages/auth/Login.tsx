import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface LoginProps {
  onToggle: () => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggle, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/users/login', formData);
      const { access_token, user } = response.data;
      if (!access_token) {
        setError('Login successful but token missing.');
        return;
      }
      login(access_token, user);
    } catch (err: any) {
      console.error('Login Error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed.';
      setError(`${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans py-12 px-4 select-none transition-colors duration-300">

      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-all z-20 group"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] p-8 md:p-10 rounded-[40px] border border-white/60 glass shadow-2xl relative z-10"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-base tracking-tight">Locolive</h1>
        </div>

        {/* Welcome Section */}
        <div className="mb-10 text-left">
          <h2 className="text-3xl font-bold text-text-base mb-2 tracking-tight">Welcome back</h2>
          <p className="text-text-muted text-sm font-medium">Sign in to discover what's around you</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">Email</label>
            <Input
              placeholder="you@example.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Password</label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            className="w-full h-14 text-base font-bold rounded-2xl mt-4 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-border-base" />
            <span className="text-[10px] font-bold text-text-muted uppercase">or</span>
            <div className="h-[1px] flex-1 bg-border-base" />
          </div>

          {/* Social Login */}
          <button
            type="button"
            className="w-full h-14 bg-bg-card/40 hover:bg-bg-card/60 border border-border-base rounded-2xl flex items-center justify-center gap-3 transition-all group active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-bold text-text-base">Continue with Google</span>
          </button>

          {/* Footer */}
          <div className="text-center pt-4 flex flex-col gap-3">
            <div>
              <span className="text-sm text-text-muted">Don't have an account? </span>
              <button
                type="button"
                onClick={onToggle}
                className="text-sm font-bold text-text-base hover:text-primary transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </div>
            
            <div className="pt-2 border-t border-border-base/50">
              <button
                type="button"
                onClick={() => window.location.href = '/admin/login'}
                className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] hover:text-primary transition-colors cursor-pointer"
              >
                Administrator Login
              </button>
            </div>
          </div>
        </form>


      </motion.div>
    </div>
  );
};

export default Login;
