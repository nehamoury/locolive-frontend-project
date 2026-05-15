import { type FC, useState } from 'react';
import { Shield, Key, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'react-hot-toast';

const SecuritySection: FC = () => {
  const { mutations } = useSettings();
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [step, setStep] = useState(1); // 1: Verify Old, 2: Enter New
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOld = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutations.verifyPassword.mutateAsync(passwords.old);
      setStep(2);
    } catch (err) {
      // Error handled by mutation toast
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwords.new.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    mutations.changePassword.mutate({
      old_password: passwords.old,
      new_password: passwords.new
    }, {
      onSuccess: () => {
        setStep(1);
        setPasswords({ old: '', new: '', confirm: '' });
        toast.success('Password updated successfully');
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Security</h2>
        <p className="text-[14px] text-text-muted font-bold">Manage your password and active sessions</p>
      </div>

      <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 md:p-8 space-y-8">
          {/* Password Change */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-black text-text-base leading-none">
                {step === 1 ? "Verify Current Password" : "Set New Password"}
              </h3>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleVerifyOld} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1 gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60">Current Password</label>
                    <button 
                      type="button"
                      onClick={() => window.location.href = '/forgot-password'}
                      className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-wider shrink-0"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input 
                    type="password"
                    value={passwords.old}
                    onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
                    className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-blue-500/50 transition-all shadow-inner"
                    placeholder="Enter current password"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={mutations.verifyPassword.isPending}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-500 text-white text-[13px] font-black uppercase rounded-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mutations.verifyPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">New Password</label>
                  <input 
                    type="password"
                    value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-blue-500/50 transition-all shadow-inner"
                    placeholder="Min. 6 chars"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Confirm New Password</label>
                  <input 
                    type="password"
                    value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-blue-500/50 transition-all shadow-inner"
                    placeholder="Confirm password"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={mutations.changePassword.isPending}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-500 text-white text-[13px] font-black uppercase rounded-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {mutations.changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update Password"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-bg-base text-text-base text-[13px] font-black uppercase rounded-2xl hover:bg-bg-sidebar transition-all border border-border-base"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="h-px bg-border-base/30" />

          {/* Sessions Management */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-text-base leading-none mb-1">Active Sessions</h3>
                  <p className="text-[12px] text-text-muted font-bold leading-tight">Revoke access from all devices</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 text-red-500 text-[11px] font-black uppercase rounded-xl hover:bg-red-500/20 transition-all"
              >
                Logout All Devices
              </button>
            </div>

            {showLogoutConfirm && (
              <div className="p-6 bg-red-500/10 rounded-3xl border border-red-500/20 animate-in slide-in-from-top-2 duration-200">
                <p className="text-red-500 text-[13px] font-bold mb-4">Sign out of all devices? This includes this session.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => mutations.logoutAllDevices.mutate()}
                    className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white text-[11px] font-black uppercase rounded-xl"
                  >
                    Yes, Logout Everywhere
                  </button>
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full sm:w-auto px-6 py-2 bg-bg-card text-text-muted text-[11px] font-black uppercase rounded-xl border border-border-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border-base/30" />

          {/* 2FA Section (Upcoming) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 opacity-60 grayscale cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-black text-text-base leading-none mb-1">Two-Factor Auth</h3>
                <p className="text-[12px] text-text-muted font-bold leading-tight">Extra layer of security (Coming Soon)</p>
              </div>
            </div>
            <div className="flex justify-end sm:justify-start">
              <div className="w-10 h-6 bg-border-base rounded-full relative">
                <div className="w-4 h-4 bg-bg-card rounded-full absolute left-1 top-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
