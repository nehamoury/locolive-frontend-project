import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AtSign, Phone, Lock, Eye, EyeOff, Check, ArrowRight, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/WhatsApp Image 2026-04-28 at 4.00.46 PM.png';


const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, login, logout, setRequiresProfileCompletion } = useAuth();
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  
  // Username check states
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'error'>('idle');
  const [usernameMsg, setUsernameMsg] = useState('');
  
  // Phone check states
  const [phoneStatus, setPhoneStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'error'>('idle');
  const [phoneMsg, setPhoneMsg] = useState('');

  // Redirect if not authenticated or profile already complete
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.is_profile_complete) {
      navigate('/dashboard/home');
    }
  }, [token, user, navigate]);

  // Check username availability
  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      return;
    }
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMsg('Min 3 chars required');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMsg('Username is available');
        } else {
          setUsernameStatus('taken');
          setUsernameMsg('Username is taken');
        }
      } catch (err: any) {
        setUsernameStatus('error');
        setUsernameMsg(err.response?.data?.error || 'Error checking username');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Check phone availability
  useEffect(() => {
    if (!phone) {
      setPhoneStatus('idle');
      setPhoneMsg('');
      return;
    }
    if (phone.length !== 10) {
      setPhoneStatus('invalid');
      setPhoneMsg('Phone must be 10 digits');
      return;
    }

    setPhoneStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-phone?phone=${encodeURIComponent(phone)}`);
        if (res.data.available) {
          setPhoneStatus('available');
          setPhoneMsg('Phone number is available');
        } else {
          setPhoneStatus('taken');
          setPhoneMsg(res.data.message || 'Phone number is already registered');
        }
      } catch (err: any) {
        setPhoneStatus('error');
        setPhoneMsg(err.response?.data?.error || 'Error checking phone');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus !== 'available') {
      setError('Please provide a valid and available username.');
      return;
    }
    if (phoneStatus !== 'available') {
      setError('Please provide a valid and available phone number.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/users/complete-profile', {
        username: username.toLowerCase().replace(/\s+/g, ''),
        phone,
      });
      
      // Accessing data through the 'data' wrapper from successResponse
      const responseData = response.data;
      const { access_token, requires_phone_verify } = responseData;
      
      if (access_token) {
        const updatedUser = responseData.user;
        
        login(access_token, updatedUser, false);
        setRequiresProfileCompletion(false);
        
        // If this is a Google user, prompt them to set a password first
        if (updatedUser?.provider === 'google' || user?.provider === 'google') {
          setShowPasswordStep(true);
          return;
        }
        
        // Redirect to phone verification if phone not verified
        if (requires_phone_verify || !updatedUser.is_phone_verified) {
          navigate('/verify-phone');
        } else if (!updatedUser.is_active) {
          navigate('/verify');
        } else {
          navigate('/dashboard/home');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to complete profile.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSettingPassword(true);
    setError('');

    try {
      const res = await api.post('/account/set-password', { password });
      const { access_token, user: updatedUser } = res.data;
      if (access_token && updatedUser) {
        login(access_token, updatedUser, false);
      }
      navigate('/verify-phone');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to set password.';
      setError(msg);
    } finally {
      setSettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans px-4 py-12 transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-[28px] p-8 shadow-2xl relative z-10 border border-white/60"
      >
        {/* Exit Button */}
        <button 
          onClick={() => logout()}
          className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-base transition-colors z-20"
          title="Exit"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img 
            src={logo} 
            alt="Locolive" 
            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/10 border border-white/50"
          />
          <span className="text-xl font-black tracking-tight text-text-base leading-none">Locolive</span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-text-base">Complete your profile</h2>
          <p className="text-sm text-text-muted mt-1">Just a few more details to get started</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Username</label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourhandle"
                className={`w-full h-12 glass-input border rounded-xl pl-11 pr-10 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none transition-all shadow-sm ${
                  (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'error') ? 'border-red-500/50 focus:border-red-500' :
                  usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                  'border-border-base focus:border-primary/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
              </div>
            </div>
            {usernameMsg && (
              <p className={`text-[10px] font-bold px-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                {usernameMsg}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full h-12 glass-input border rounded-xl pl-11 pr-10 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none transition-all shadow-sm ${
                  (phoneStatus === 'invalid' || phoneStatus === 'taken' || phoneStatus === 'error') ? 'border-red-500/50 focus:border-red-500' :
                  phoneStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                  'border-border-base focus:border-primary/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                {phoneStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                {phoneStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
              </div>
            </div>
            {phoneMsg && (
              <p className={`text-[10px] font-bold px-1 ${phoneStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                {phoneMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Completing profile...
              </>
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {showPasswordStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-border-base pt-6 mt-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-black text-text-base">Set a password</h3>
              <p className="text-xs text-text-muted mt-1">
                Your Google account is linked. Now create a password so you can log in with your username next time.
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-11 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-base transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={settingPassword}
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
              >
                {settingPassword ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Setting password...</>
                ) : (
                  <>Set Password & Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {!showPasswordStep && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => logout()}
              className="text-[13px] font-bold text-text-muted/60 hover:text-text-base transition-colors py-2"
            >
              Cancel & Exit
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CompleteProfile;

