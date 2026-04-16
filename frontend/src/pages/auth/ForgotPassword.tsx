import React, { useState } from 'react';
import { ArrowLeft, MapPin, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import authService from '../../services/authService';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      console.error('Forgot Password Error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Something went wrong.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base relative overflow-hidden font-sans py-12 px-4 select-none">
      
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-all z-20 group"
        aria-label="Back to login"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to login
      </button>

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

        {isSent ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-base mb-3">Check your email</h2>
            <p className="text-text-muted text-sm mb-8 leading-relaxed">
              If an account exists for <span className="text-text-base font-bold">{email}</span>, you will receive a reset link shortly.
            </p>
            <Button onClick={onBack} variant="secondary" className="w-full h-14 rounded-2xl">
              Return to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-bold text-text-base mb-2 tracking-tight">Forgot password?</h2>
              <p className="text-text-muted text-sm font-medium leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>
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
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative">
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                </div>
              </div>

              <Button
                className="w-full h-14 text-base font-bold rounded-2xl mt-4 active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
