import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'user' | 'post' | 'reel' | 'story';
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', desc: 'Commercial tags or repetitive content' },
  { id: 'abuse', label: 'Abuse/Hate', desc: 'Harassment or hate speech' },
  { id: 'inappropriate', label: 'Inappropriate', desc: 'Adult content or violence' },
  { id: 'other', label: 'Other', desc: 'Something else' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetId, targetType }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || loading) return;

    setLoading(true);
    try {
      await api.post('/reports', {
        target_id: targetId,
        target_type: targetType,
        reason: reason,
        description: description,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      console.error('Report failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:w-[400px] md:-translate-x-1/2 bg-bg-card border border-border-base rounded-[32px] shadow-2xl z-[101] overflow-hidden"
          >
            {submitted ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-text-base mb-2">Report Submitted</h3>
                <p className="text-text-muted text-sm font-medium">Thank you for keeping LocoLiv safe. Our team will review this shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-base/50">
                  <div className="flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-black tracking-tight">Report Content</h3>
                  </div>
                  <button type="button" onClick={onClose} className="p-2 hover:bg-bg-sidebar rounded-full transition-colors">
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Why are you reporting this?</p>
                  
                  <div className="grid gap-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setReason(r.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          reason === r.id 
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-sm' 
                          : 'bg-bg-sidebar/30 border-border-base/50 hover:bg-bg-sidebar/50'
                        }`}
                      >
                        <div className="font-black text-sm text-text-base mb-1">{r.label}</div>
                        <div className="text-[10px] text-text-muted font-bold">{r.desc}</div>
                      </button>
                    ))}
                  </div>

                  {reason && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                    >
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Additional details (optional)"
                        className="w-full mt-4 bg-bg-sidebar/50 border border-border-base/50 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        rows={3}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="p-6 bg-bg-sidebar/20 border-t border-border-base/50">
                  <button
                    type="submit"
                    disabled={!reason || loading}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
