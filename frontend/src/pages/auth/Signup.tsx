import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Check, 
  Zap,
  AtSign,
  MapPin
} from 'lucide-react';
import { SEOHead } from '../../components/ui/SEOHead';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface SignupProps {
  onToggle: () => void;
  onBack?: () => void;
}

type Step = 1 | 2 | 3 | 4;

const SESSION_KEY = 'signup_session_id';

const Stepper = ({ step }: { step: Step }) => {
  const steps = [1, 2, 3, 4];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s) => (
        <React.Fragment key={s}>
          <div 
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
              s === step 
                ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' 
                : s < step 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-transparent border-border-base text-text-muted/40'
            }`}
          >
            {s < step ? <Check className="w-3.5 h-3.5" /> : s}
          </div>
          {s < 4 && (
            <div className={`w-8 h-[2px] rounded-full transition-all duration-500 ${s < step ? 'bg-primary' : 'bg-border-base'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Signup: React.FC<SignupProps> = ({ onToggle, onBack }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [email, setEmail] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const bootstrappedRef = useRef(false);

  const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  const extractSessionId = (responseData: any): string => {
    if (!responseData) return '';
    // Handle all possible wrapper shapes
    const inner = responseData.data || responseData;
    return inner.signup_session_id || inner.signupSessionId || '';
  };

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const boot = async () => {
      try {
        const existing = localStorage.getItem(SESSION_KEY) || '';
        const res = await authService.startPreverify(existing || undefined);

        const sid = extractSessionId(res.data);
        if (sid) {
          setSessionId(sid);
          localStorage.setItem(SESSION_KEY, sid);
          return;
        }
      } catch {
        // fall through to local fallback
      }
      // Fallback: generate locally if backend didn't return one
      const fallback = generateUUID();
      setSessionId(fallback);
      localStorage.setItem(SESSION_KEY, fallback);
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }
    if (username.trim().length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username must be at least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const api = await import('../../services/api');
        const res = await api.default.get(`/users/check-username?username=${encodeURIComponent(username.trim())}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username available');
        } else {
          setUsernameStatus('taken');
          setUsernameMessage('Username already taken');
        }
      } catch {
        setUsernameStatus('error');
        setUsernameMessage('Unable to check username right now');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const sendEmailOTP = async () => {
    if (!sessionId) {
      setError('Session expired. Please refresh the page.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.sendEmailOTP(sessionId, email.trim().toLowerCase());
      setEmailOtpSent(true);
      if (res.data?.dev_otp) {
        setEmailOTP(res.data.dev_otp);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(err?.response?.data?.error || 'Unable to send email OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyEmailOTP(sessionId, emailOTP);
      setEmailToken(res.data.email_verification_token);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email verification code');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOTP = async () => {
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.sendPhoneOTP(sessionId, phone.trim(), emailToken);
      setPhoneOtpSent(true);
      if (res.data?.dev_otp) {
        // Automatically fill the OTP in development mode so user doesn't have to check terminal
        setPhoneOTP(res.data.dev_otp);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to send phone OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyPhoneOTP(sessionId, phoneOTP, emailToken);
      setPhoneToken(res.data.phone_verification_token);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid phone verification code');
    } finally {
      setLoading(false);
    }
  };

  const goToProfileStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStep(4);
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.signup({
        signup_session_id: sessionId,
        email_verification_token: emailToken,
        phone_verification_token: phoneToken,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        username: username.trim(),
        full_name: fullName.trim(),
        is_ghost_mode: false,
      });

      const { access_token, user } = res.data;
      login(access_token, user, false);
      localStorage.removeItem(SESSION_KEY);
      navigate('/dashboard/home');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans transition-colors duration-300">
      <SEOHead title="Create Account | Locolive" description="Join Locolive — the location-based social platform." />
      
      {/* Background glow elements */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full h-screen sm:h-auto sm:max-w-md sm:glass sm:rounded-[28px] p-8 sm:shadow-2xl relative z-10 sm:border sm:border-white/60 flex flex-col justify-center bg-bg-base/40 sm:bg-transparent overflow-y-auto">
        
        {/* Header with Back and Sign In */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => step > 1 ? setStep((step - 1) as Step) : onBack?.()} 
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
               <MapPin className="w-4 h-4 text-primary" />
             </div>
             <span className="text-sm font-black text-text-base">Locolive</span>
          </div>

          <button 
            onClick={onToggle} 
            className="text-sm font-bold text-primary hover:text-accent transition-colors"
          >
            Sign in
          </button>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        <div className="mb-6">
          <h1 className="text-2xl font-black text-text-base tracking-tight">
            {step === 1 && "Verify your email"}
            {step === 2 && "Verify your phone"}
            {step === 3 && "Set your password"}
            {step === 4 && "Complete profile"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {step === 1 && "We'll send a code to confirm your email"}
            {step === 2 && "Almost there! Now confirm your phone"}
            {step === 3 && "Choose a secure password for your account"}
            {step === 4 && "Tell us a bit about yourself"}
          </p>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sendEmailOTP}
                  disabled={loading || emailOtpSent}
                  className={`w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                    emailOtpSent
                      ? 'bg-green-500/20 border border-green-500/40 text-green-600'
                      : 'bg-bg-card/40 hover:bg-bg-card/60 border border-border-base text-text-base'
                  }`}
                >
                  {loading ? "Sending..." : emailOtpSent ? "Code Sent ✓" : "Send Verification Code"}
                </button>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">6-Digit Code</label>
                  <input
                    type="text"
                    name="emailOTP"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={emailOTP}
                    onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-12 glass-input border border-border-base rounded-xl px-4 text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={verifyEmailOTP}
                  disabled={loading || emailOTP.length !== 6}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm mt-2 cursor-pointer disabled:opacity-50"
                >
                  Verify & Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PHONE */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sendPhoneOTP}
                  disabled={loading || phoneOtpSent}
                  className={`w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                    phoneOtpSent
                      ? 'bg-green-500/20 border border-green-500/40 text-green-600'
                      : 'bg-bg-card/40 hover:bg-bg-card/60 border border-border-base text-text-base'
                  }`}
                >
                  {loading ? "Sending..." : phoneOtpSent ? "Code Sent ✓" : "Send OTP to Phone"}
                </button>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">6-Digit OTP</label>
                  <input
                    type="text"
                    name="phoneOTP"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={phoneOTP}
                    onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-12 glass-input border border-border-base rounded-xl px-4 text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={verifyPhoneOTP}
                  disabled={loading || phoneOTP.length !== 6}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm mt-2 cursor-pointer disabled:opacity-50"
                >
                  Verify Phone <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PASSWORD */}
          {step === 3 && (
            <motion.form
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              onSubmit={goToProfileStep}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-11 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-base cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm mt-2 cursor-pointer"
              >
                Set Password <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {/* STEP 4: PROFILE */}
          {step === 4 && (
            <motion.form
              key="step4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              onSubmit={submitSignup}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a handle"
                    className={`w-full h-12 glass-input border rounded-xl pl-11 pr-11 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none transition-all shadow-sm ${
                      usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' : 
                      (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'border-red-500/50 focus:border-red-500' : 
                      'border-border-base focus:border-primary/50'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                {usernameMessage && (
                  <p className={`text-[10px] font-bold px-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                    {usernameMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>Create Account <Zap className="w-4 h-4" /></>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-text-muted/40 mt-8">
          By joining, you agree to our{' '}
          <button className="text-primary font-bold hover:underline">Terms</button> &{' '}
          <button className="text-primary font-bold hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
