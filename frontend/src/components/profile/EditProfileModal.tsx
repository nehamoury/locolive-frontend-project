import { type FC, useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, Check, User, AtSign, AlignLeft } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { BACKEND } from '../../utils/config';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: {
        full_name: string;
        username: string;
        bio: string;
        avatar_url: string;
    };
    onUpdate: () => void;
}

const EditProfileModal: FC<EditProfileModalProps> = ({ isOpen, onClose, initialData, onUpdate }) => {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setImage(reader.result as string);
            };
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let avatarUrl = formData.avatar_url;

            // 1. If an image is selected for cropping, upload it first
            if (image && croppedAreaPixels) {
                const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
                if (croppedImageBlob) {
                    const uploadData = new FormData();
                    uploadData.append('file', croppedImageBlob, 'avatar.jpg');
                    
                    const { data: uploadRes } = await api.post('/upload', uploadData);
                    avatarUrl = uploadRes.url;
                }
            }

            // 2. Update profile
            const updatePayload = {
                full_name: formData.full_name,
                username: formData.username,
                bio: formData.bio,
                avatar_url: avatarUrl,
            };

            await api.put('/profile', updatePayload);
            
            // 3. Update Global Auth Context
            updateUser({
                full_name: formData.full_name,
                username: formData.username,
                bio: formData.bio,
                avatar_url: avatarUrl,
            });

            toast.success('Profile updated successfully!');
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 dark:bg-bg-base/80 backdrop-blur-xl"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-white/90 dark:bg-bg-card/90 backdrop-blur-2xl rounded-[40px] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-text-base tracking-tight">Edit Profile</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Refine your identity</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-pink-500 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-[40px] p-1 bg-gradient-to-tr from-pink-500 to-fuchsia-500 shadow-xl shadow-pink-500/20">
                                    <div className="w-full h-full rounded-[38px] bg-white dark:bg-bg-card overflow-hidden relative">
                                        <img 
                                            src={image || (formData.avatar_url.startsWith('http') ? formData.avatar_url : `${BACKEND}${formData.avatar_url}`)} 
                                            alt="avatar" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-bg-card rounded-2xl shadow-lg border border-slate-100 dark:border-white/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tap to update photo</p>
                        </div>

                        {/* Cropper Modal (Only if image is selected) */}
                        {image && (
                            <div className="space-y-4">
                                <div className="relative h-64 w-full bg-slate-100 dark:bg-white/5 rounded-[32px] overflow-hidden border-2 border-dashed border-pink-500/30">
                                    <Cropper
                                        image={image}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        cropShape="round"
                                        showGrid={false}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Zoom</span>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="flex-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none accent-pink-500"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setImage(null)}
                                        className="text-xs font-black text-red-500 uppercase tracking-widest px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10"
                                    >
                                        Cancel Crop
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Full Name
                                </label>
                                <input 
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 focus:border-pink-500/50 outline-none transition-all font-bold text-slate-700 dark:text-text-base shadow-sm"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 flex items-center gap-2">
                                    <AtSign className="w-3 h-3" /> Username
                                </label>
                                <input 
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 focus:border-pink-500/50 outline-none transition-all font-bold text-slate-700 dark:text-text-base shadow-sm"
                                    placeholder="Username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 flex items-center gap-2">
                                <AlignLeft className="w-3 h-3" /> Bio
                            </label>
                            <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full px-6 py-4 rounded-[28px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 focus:border-pink-500/50 outline-none transition-all font-bold text-slate-700 dark:text-text-base shadow-sm resize-none"
                                rows={4}
                                placeholder="Tell the world about yourself..."
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-xs font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95 border border-slate-100 dark:border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditProfileModal;
