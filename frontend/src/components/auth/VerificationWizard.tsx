import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { sendPhoneOTP, verifyPhoneOTP, resetFirebaseAuth } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import { Mail, Phone, ShieldCheck, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VerificationWizard: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'email' | 'phone' | 'success'>(
    user?.is_email_verified ? 'phone' : 'email'
  );
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.is_active) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Clean up Firebase Auth on unmount
  useEffect(() => {
    return () => resetFirebaseAuth();
  }, []);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-email');
      toast.success('Verification email sent!');
      setTimer(60);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const handleSendOTP = async () => {
    if (!user?.phone) {
      toast.error('Phone number not found');
      return;
    }
    setResending(true);
    try {
      await sendPhoneOTP(user.phone);
      toast.success('OTP sent to your phone!');
      setTimer(60);
    } catch (err: any) {
      toast.error('Failed to send OTP. Please try again.');
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify with Firebase and get ID Token
      const firebaseToken = await verifyPhoneOTP(otp);
      
      // 2. Send Firebase Token to our backend
      const res = await api.post('/auth/verify-firebase-phone', { 
        firebase_token: firebaseToken 
      });
      
      updateUser(res.data.user);
      toast.success('Phone verified successfully!');
      setStep('success');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile/me');
      updateUser(res.data);
      if (res.data.is_email_verified) {
        toast.success('Email verified!');
        setStep('phone');
      } else {
        toast.error('Email not yet verified. Please check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] flex flex-col items-center justify-center p-4">
      {/* Firebase reCAPTCHA Container (Hidden) */}
      <div id="recaptcha-container"></div>

      <div className="max-w-md w-full bg-[#1A1A23] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />

        <button 
          onClick={() => logout()}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-20"
          title="Exit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-violet-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
          <p className="text-gray-400 mb-8">Secure your account by verifying your identity</p>

          <div className="flex items-center gap-4 mb-10">
            <div className={`w-3 h-3 rounded-full ${step === 'email' ? 'bg-pink-500 ring-4 ring-pink-500/20' : 'bg-green-500'}`} />
            <div className={`h-[2px] w-8 ${step === 'email' ? 'bg-gray-700' : 'bg-green-500'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'phone' ? 'bg-pink-500 ring-4 ring-pink-500/20' : step === 'success' ? 'bg-green-500' : 'bg-gray-700'}`} />
            <div className={`h-[2px] w-8 ${step === 'success' ? 'bg-green-500' : 'bg-gray-700'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'success' ? 'bg-green-500 ring-4 ring-green-500/20' : 'bg-gray-700'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                <div className="bg-white/5 rounded-2xl p-6 mb-6 text-left border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="text-pink-500 w-5 h-5" />
                    <span className="text-white font-medium">Email Verification</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    We've sent a verification link to <span className="text-white font-semibold">{user?.email}</span>. 
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={checkEmailStatus}
                      disabled={loading}
                      className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'I\'ve Verified My Email'}
                      {!loading && <ChevronRight className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleResendEmail}
                      disabled={resending || timer > 0}
                      className="text-gray-500 text-sm hover:text-white transition-colors py-2"
                    >
                      {timer > 0 ? `Resend email in ${timer}s` : 'Didn\'t get the email? Resend'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                <form onSubmit={handleVerifyPhone} className="bg-white/5 rounded-2xl p-6 mb-6 text-left border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="text-blue-500 w-5 h-5" />
                    <span className="text-white font-medium">Phone Verification (Firebase)</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Enter the code sent to <span className="text-white font-semibold">{user?.phone}</span>
                  </p>
                  
                  <div className="relative mb-6">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-black/40 border-2 border-white/10 rounded-xl py-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:border-pink-500 outline-none transition-all placeholder:text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={resending || timer > 0}
                    className="w-full text-gray-500 text-sm hover:text-white transition-colors py-4 text-center"
                  >
                    {timer > 0 ? `Resend OTP in ${timer}s` : 'Send OTP via SMS'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                <div className="bg-green-500/10 rounded-2xl p-8 mb-8 text-center border border-green-500/20">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Verified!</h3>
                  <p className="text-gray-400">Your account is now fully active. Welcome to Locolive!</p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                >
                  Enter Locolive
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button onClick={() => logout()} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium rounded-full transition-all active:scale-95">
              Cancel & Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-gray-600 text-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>Secured by Firebase Phone Authentication</span>
      </div>
    </div>
  );
};

export default VerificationWizard;
