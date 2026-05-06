import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendPhoneOTP, verifyPhoneOTP, resetFirebaseAuth } from '../../services/firebase';
import api from '../../services/api';
import { Button } from '../../components/ui/button';

interface VerifyPhoneProps {
  onBack?: () => void;
  phoneNumber?: string;
  onVerified?: () => void;
}

const VerifyPhone: React.FC<VerifyPhoneProps> = ({ onBack, phoneNumber: initialPhone, onVerified }) => {
  const [phone, setPhone] = useState(initialPhone || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>(initialPhone ? 'otp' : 'phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Helper to set ref
  const setOtpRef = (el: HTMLInputElement | null, idx: number) => {
    otpRefs.current[idx] = el;
  };
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      resetFirebaseAuth();
    };
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    try {
      await sendPhoneOTP(formattedPhone);
      setStep('otp');
      setResendCooldown(30);
      setError('');
    } catch (err: any) {
      let msg = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        msg = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please try again later.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const firebaseToken = await verifyPhoneOTP(otpCode);

      // Send Firebase token to backend for verification
      await api.post('/auth/verify-firebase-phone', {
        firebase_token: firebaseToken,
      });

      setSuccess('Phone verified successfully!');
      resetFirebaseAuth();

      setTimeout(() => {
        if (onVerified) {
          onVerified();
        } else {
          navigate('/dashboard/home');
        }
      }, 1000);
    } catch (err: any) {
      let msg = 'Invalid OTP. Please try again.';
      if (err.code === 'auth/invalid-verification-code') {
        msg = 'Invalid OTP code.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendCooldown === 0) {
      handleSendOTP();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-screen sm:h-auto sm:max-w-[440px] p-6 sm:p-10 sm:rounded-[40px] sm:border sm:border-white/60 sm:glass sm:shadow-2xl relative z-10 flex flex-col justify-center sm:bg-transparent bg-bg-base/40"
      >
        <button
          onClick={onBack || (() => navigate(-1))}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-10">
          <h1 className="text-2xl font-black text-text-base tracking-tight mb-2">
            {step === 'phone' ? 'Verify Phone Number' : 'Enter OTP'}
          </h1>
          <p className="text-sm text-text-muted">
            {step === 'phone'
              ? 'We will send you a verification code'
              : `Code sent to ${phone.startsWith('+') ? phone : `+91${phone}`}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/40" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full h-12 glass-input border border-border-base rounded-xl pl-12 pr-4 text-text-base text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all"
                    maxLength={10}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button
                onClick={handleSendOTP}
                disabled={isLoading || phone.length !== 10}
                className="w-full h-14 text-base font-bold rounded-2xl"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex gap-2 justify-center">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => setOtpRef(el, idx)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-border-base rounded-xl bg-bg-card/40 text-text-base focus:border-primary focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

                {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium text-center flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {success}
                </motion.div>
              )}

              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full h-14 text-base font-bold rounded-2xl"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="text-sm font-semibold text-primary hover:text-accent transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* reCAPTCHA container - required by Firebase */}
      <div id="recaptcha-container" />
    </div>
  );
};

export default VerifyPhone;
