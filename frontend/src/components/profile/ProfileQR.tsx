import { type FC } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { X, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ProfileQRProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    profileUrl: string;
}

const ProfileQR: FC<ProfileQRProps> = ({ isOpen, onClose, username, profileUrl }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success('Profile link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-bg-base/60 backdrop-blur-xl"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-sm glass rounded-[40px] overflow-hidden p-10 flex flex-col items-center gap-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-border-base/50"
            >
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2.5 rounded-full bg-bg-base/50 hover:bg-bg-base text-text-muted hover:text-text-base transition-all active:scale-90 border border-border-base/30"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="space-y-2 text-center mt-2">
                    <h3 className="text-2xl font-black text-text-base tracking-tight">Share Profile</h3>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">@{username}</p>
                </div>

                {/* QR Code Container */}
                <div className="relative group p-8 bg-white rounded-[32px] shadow-2xl shadow-primary/10 transition-transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-primary/5 rounded-[32px] blur-2xl group-hover:opacity-100 opacity-0 transition-opacity" />
                    <div className="relative z-10">
                        <QRCode
                            value={profileUrl}
                            size={180}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                            fgColor="var(--color-bg-base)"
                            bgColor="transparent"
                        />
                    </div>
                </div>

                <div className="flex gap-4 w-full">
                    <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] bg-bg-card hover:bg-bg-base border border-border-base text-sm font-black uppercase tracking-widest text-text-base transition-all active:scale-95 shadow-sm"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-primary" />}
                        {copied ? 'Copied' : 'Link'}
                    </button>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `Locolive - @${username}`,
                                    url: profileUrl
                                });
                            }
                        }}
                        className="w-16 h-16 rounded-[20px] bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileQR;
