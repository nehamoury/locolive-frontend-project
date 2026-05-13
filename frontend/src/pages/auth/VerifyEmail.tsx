import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing verification token');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('auth/verify-email', { token });
        updateUser(res.data.user);
        setStatus('success');
        toast.success('Email verified successfully!');
        // Wait 2 seconds and then go to verify (for phone) or home
        setTimeout(() => {
          navigate('/verify');
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed');
      }
    };

    verify();
  }, [token, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-[#0F0F13] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1A23] rounded-3xl p-10 border border-white/5 shadow-2xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-pink-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait while we confirm your verification link.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verified!</h1>
            <p className="text-gray-400 mb-8">Your email has been successfully confirmed.</p>
            <p className="text-gray-500 text-sm">Redirecting to next step...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-red-400 mb-8 font-medium">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
