import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../../components/ui/SEOHead';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/WhatsApp Image 2026-04-28 at 4.00.46 PM.png';


// Declare google for TypeScript
declare global {
  interface Window {
    google: any;
    google_initialized?: boolean;
  }
}

interface LoginProps {
  onToggle: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ identity: '', password: '' });
  const { login, setRequiresProfileCompletion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.google && !window.google_initialized) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      window.google_initialized = true;
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', {
        id_token: response.credential
      });
      const { access_token, user, requires_profile_completion } = res.data;
      
      if (requires_profile_completion) {
        login(access_token, user, true);
        setRequiresProfileCompletion(true);
        navigate('/complete-profile');
      } else if (!user.is_phone_verified) {
        login(access_token, user, false);
        navigate('/verify-phone');
      } else {
        login(access_token, user, false);
        navigate('/dashboard/home');
      }
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      setError('Google Sign-In is not available. Please try again later.');
      return;
    }

    // Using OAuth2 Token Client flow which is more reliable for custom buttons
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setIsLoading(true);
            try {
              const res = await api.post('/auth/google', {
                access_token: tokenResponse.access_token
              });
              const { access_token, user, requires_profile_completion } = res.data;
              
              if (requires_profile_completion) {
                login(access_token, user, true);
                setRequiresProfileCompletion(true);
                navigate('/complete-profile');
              } else if (!user.is_phone_verified) {
                login(access_token, user, false);
                navigate('/verify-phone');
              } else {
                login(access_token, user, false);
                navigate('/dashboard/home');
              }
            } catch (err: any) {
              console.error('Google Login Error:', err);
              setError('Google login failed. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      });

    client.requestAccessToken();
  };

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
      
      // Manual login users have is_profile_complete = true by default
      login(access_token, user, false);
      
      // Redirect based on verification status
      if (!user.is_phone_verified) {
        navigate('/verify-phone');
      } else if (!user.is_active) {
        navigate('/verify');
      } else {
        navigate('/dashboard/home');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed.';
      setError(`${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans select-none transition-colors duration-300">
      <SEOHead title="Login" description="Sign in to Locolive and discover people, stories, and moments around you." url="https://locolive.appnity.co.in/login" />

      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-screen sm:h-auto sm:max-w-[440px] p-6 sm:p-10 sm:rounded-[40px] sm:border sm:border-white/60 sm:glass sm:shadow-2xl relative z-10 flex flex-col justify-center sm:block bg-bg-base/40 sm:bg-transparent"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-10">
          <img 
            src={logo} 
            alt="Locolive" 
            className="w-12 h-12 rounded-2xl object-cover shadow-xl shadow-primary/20 border-2 border-white/50 ring-4 ring-primary/5"
          />
          <div>
            <h1 className="text-2xl font-black text-text-base tracking-tighter leading-none">Locolive</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Discover Nearby</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-10 text-left">
          <h2 className="text-3xl font-bold text-text-base mb-2 tracking-tight">Welcome back</h2>
          <p className="text-text-muted text-sm font-medium">Sign in to discover what&apos;s around you</p>
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
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">Identity</label>
            <Input
              placeholder="Email, username or phone"
              type="text"
              required
              autoComplete="username"
              value={formData.identity}
              onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
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
                autoComplete="current-password"
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

          {/* Footer */}
          <div className="text-center pt-4 flex flex-col gap-3">
            <div>
              <span className="text-sm text-text-muted">Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={onToggle}
                className="text-sm font-bold text-text-base hover:text-primary transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Google Recovery Login (subtle secondary) */}
          <div className="pt-2 border-t border-border-base/40">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-text-muted hover:text-primary transition-colors cursor-pointer group"
            >
              <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
          </div>
        </form>


      </motion.div>
    </div>
  );
};

export default Login;

