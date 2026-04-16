import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Mail, Lock, AtSign, User, Eye, EyeOff, Check, MapPin, Zap, Phone, Footprints } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SignupProps {
  onToggle: () => void;
  onBack?: () => void;
}

type Step = 1 | 2 | 3;

interface FormData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  phone: string;
  avatar?: File;
  ghostMode: boolean;
  allowCrossings: boolean;
}

const STEP_LABELS = ['Account', 'Profile', 'Privacy'];

const Stepper = ({ step }: { step: Step }) => (
  <div className="flex items-center gap-2 mb-8">
    {STEP_LABELS.map((label, idx) => {
      const num = idx + 1;
      const done = num < step;
      const active = num === step;
      return (
        <React.Fragment key={label}>
          {idx > 0 && (
            <div className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${done ? 'bg-primary' : 'bg-primary/10'}`} />
          )}
          <div className="flex items-center gap-1.5 font-sans">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${done ? 'bg-primary border-primary text-white' : active ? 'bg-primary border-primary text-white' : 'bg-transparent border-border-base text-text-muted/40'}`}>
              {done ? <Check className="w-3.5 h-3.5" /> : num}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-text-base' : done ? 'text-text-muted' : 'text-text-muted/40'}`}>{label}</span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

const Signup: React.FC<SignupProps> = ({ onToggle, onBack }) => {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();

  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    phone: '',
    ghostMode: false,
    allowCrossings: true,
  });

  const set = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('avatar', file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.full_name.trim()) { setError('Please fill in all fields.'); return; }
    setError('');
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Generate a unique numeric placeholder from the email to avoid unique constraint
      // violations when multiple users sign up without entering a phone number.
      let phoneHash = 0;
      for (let i = 0; i < form.email.length; i++) {
        phoneHash = ((phoneHash << 5) - phoneHash + form.email.charCodeAt(i)) | 0;
      }
      const uniquePhone = form.phone || String(Math.abs(phoneHash) % 9000000000 + 1000000000);

      const payload = {
        email: form.email,
        password: form.password,
        username: form.username.toLowerCase().replace(/\s+/g, ''),
        full_name: form.full_name,
        phone: uniquePhone,
        is_ghost_mode: form.ghostMode,
      };

      const response = await api.post('/users', payload);
      const { access_token, user } = response.data;
      if (access_token && user) {
        login(access_token, user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans px-4 py-12 transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      <div className="w-full max-w-md glass rounded-[28px] p-8 shadow-2xl relative z-10 border border-white/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-text-base">Locolive</span>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Account ─── */}
          {step === 1 && (
            <motion.form
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleStep1}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-text-base">Create your account</h2>
                <p className="text-sm text-text-muted mt-1">Start discovering your neighborhood</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-11 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-base transition-colors cursor-pointer"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm mt-2 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-text-muted/40 pt-1">
                Already have an account?{' '}
                <button type="button" onClick={onToggle} className="text-primary font-bold hover:text-accent transition-colors">
                  Sign in
                </button>
              </p>
            </motion.form>
          )}

          {/* ─── STEP 2: Profile ─── */}
          {step === 2 && (
            <motion.form
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleStep2}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-text-base">Set up your profile</h2>
                <p className="text-sm text-text-muted mt-1">How should others see you?</p>
              </div>


              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Username</label>

                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => set('username', e.target.value)}
                    placeholder="yourhandle"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />

                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Display Name</label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => set('full_name', e.target.value)}
                    placeholder="Your Name"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />

                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Phone Number <span className="text-text-muted/30 normal-case font-normal">(optional)</span></label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-11 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                  />

                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Profile Photo</label>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-text-base opacity-60 hover:bg-primary/20 transition-all overflow-hidden"

                  >
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      : <User className="w-6 h-6" />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold text-text-base bg-primary/5 border border-primary/10 rounded-xl hover:bg-primary/10 transition-all"

                  >
                    Upload Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 w-12 flex items-center justify-center bg-primary/5 border border-primary/10 rounded-xl text-text-muted/40 hover:text-text-base hover:bg-primary/10 transition-all"
                >

                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all text-sm"

                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}

          {/* ─── STEP 3: Privacy ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black text-text-base">Privacy Settings</h2>
                <p className="text-sm text-text-muted mt-1">You control your data, always.</p>
              </div>

              {/* Ghost Mode Toggle */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-border-base flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    <motion.div animate={{ opacity: form.ghostMode ? 1 : 0.5 }}>
                      <Zap className={`w-5 h-5 ${form.ghostMode ? 'text-primary' : 'text-text-muted'}`} />
                    </motion.div>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-base">Ghost Mode</p>
                    <p className="text-xs text-text-muted/60 mt-0.5">Hide your location from everyone. You can still browse the map.</p>
                  </div>
                </div>
                <button
                  onClick={() => set('ghostMode', !form.ghostMode)}
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${form.ghostMode ? 'bg-primary' : 'bg-border-base'}`}
                  aria-label="Toggle Ghost Mode"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form.ghostMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Allow Crossings Toggle */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-border-base flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    <Footprints className={`w-5 h-5 ${form.allowCrossings ? 'text-primary' : 'text-text-muted'}`} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-base">Allow Crossings</p>
                    <p className="text-xs text-text-muted/60 mt-0.5">Let the app notify you when you cross paths with someone.</p>
                  </div>
                </div>
                <button
                  onClick={() => set('allowCrossings', !form.allowCrossings)}
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${form.allowCrossings ? 'bg-primary' : 'bg-border-base'}`}
                  aria-label="Toggle Crossings"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form.allowCrossings ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Panic Mode (info only) */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-border-base">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    <Check className="w-5 h-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-base">Panic Mode</p>
                    <p className="text-xs text-text-muted/60 mt-0.5">Triple-tap the screen to instantly delete all your data and go offline. Always available in Settings.</p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(2)}
                  className="h-12 w-12 flex items-center justify-center bg-primary/5 border border-border-base rounded-xl text-text-muted/40 hover:text-text-base hover:bg-primary/10 transition-all cursor-pointer"
                  aria-label="Go back to step 2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="flex-1 h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>Join Locolive <Zap className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Signup;
