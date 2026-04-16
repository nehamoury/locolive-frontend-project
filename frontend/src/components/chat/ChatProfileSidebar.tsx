import { useState, useEffect, type FC, useCallback } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  User,
  BellOff,
  Slash,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  VolumeX
} from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import toast from 'react-hot-toast';

interface ChatProfileSidebarProps {
  userId: string;
  onViewFullProfile?: (userId: string) => void;
}

const ChatProfileSidebar: FC<ChatProfileSidebarProps> = ({ userId, onViewFullProfile }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['general', 'media']);
  const [sharedMedia, setSharedMedia] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const profileRes = await api.get(`/users/${userId}`);
      setProfile(profileRes.data);

      // Fetch Chat History to extract media
      const historyRes = await api.get('/messages', { params: { user_id: userId } });
      const media = (historyRes.data || [])
        .filter((msg: any) => msg.media_url)
        .slice(-9) // Get last 9 media items
        .reverse();
      setSharedMedia(media);

    } catch (err) {
      console.error('Failed to fetch user data for sidebar:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleBlock = async () => {
    if (!window.confirm('Are you sure you want to block this user? They will no longer be able to message you.')) return;
    
    try {
      await api.post('/privacy/block', { user_id: userId });
      toast.success('User blocked successfully');
      // Potential redirect or parent notification logic here
    } catch (err) {
      toast.error('Failed to block user');
      console.error(err);
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted for this chat');
  };

  if (loading) {
    return (
      <div className="w-full h-full p-8 flex flex-col items-center bg-white/50 backdrop-blur-3xl">
        <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse mb-6" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse mb-3" />
        <div className="h-3 bg-gray-100 rounded-lg w-1/3 animate-pulse" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-3xl p-6 space-y-8 font-brand min-w-[320px] transition-all duration-500">
      {/* Top Profile Card */}
      <div className="flex flex-col items-center text-center mt-4">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-[32px] p-1 bg-brand-gradient shadow-xl shadow-primary/20">
            <div className="w-full h-full rounded-[28px] bg-white flex items-center justify-center overflow-hidden border-4 border-white">
              <img 
                src={getMediaUrl(profile.avatar_url, FALLBACKS.AVATAR(profile.username))} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 p-1 bg-emerald-500 border-4 border-white rounded-full shadow-lg w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-[18px] font-black text-text-base leading-tight tracking-tight uppercase italic px-2 w-full truncate">
            {profile.full_name || `@${profile.username}`}
          </h3>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-black italic">
              {profile.bio ? 'Creative Soul' : 'Locolive Member'}
            </span>
            {profile.is_verified && <ShieldCheck className="w-3 h-3 text-primary" />}
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center justify-center gap-4">
         <button 
           onClick={() => onViewFullProfile?.(userId)}
           className="p-3.5 bg-white border border-border-base rounded-2xl text-text-muted hover:text-primary hover:border-primary/40 shadow-sm transition-all active:scale-95"
           title="View Profile"
         >
            <User className="w-5 h-5" />
         </button>
         <button 
           onClick={handleMute}
           className={`p-3.5 bg-white border border-border-base rounded-2xl shadow-sm transition-all active:scale-95 ${isMuted ? 'text-secondary border-secondary/40' : 'text-text-muted hover:text-primary hover:border-primary/40'}`}
           title={isMuted ? "Unmute" : "Mute Notifications"}
         >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
         </button>
         <button 
           onClick={handleBlock}
           className="p-3.5 bg-white border border-border-base rounded-2xl text-text-muted hover:text-red-500 hover:border-red-200 shadow-sm transition-all active:scale-95" 
           title="Block User"
         >
            <Slash className="w-5 h-5" />
         </button>
      </div>

      <div className="space-y-6 pt-2 overflow-y-auto no-scrollbar">
        {/* General Info */}
        <SidebarSection 
          title="General Info" 
          isOpen={expandedSections.includes('general')} 
          onToggle={() => toggleSection('general')}
        >
          <div className="space-y-4 pt-4 bg-bg-card/50 rounded-2xl p-4 mt-2 border border-border-base shadow-sm">
            <InfoItem 
              icon={<Mail className="w-3 h-3" />} 
              label="Email Address" 
              value={profile.email || 'Private'} 
            />
            <InfoItem 
              icon={<Phone className="w-3 h-3" />} 
              label="Phone" 
              value={profile.phone || 'Not shared'} 
            />
            <InfoItem 
              icon={<Calendar className="w-3 h-3" />} 
              label="Joined" 
              value={new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
            />
          </div>
        </SidebarSection>

        {/* Shared Media */}
        <SidebarSection 
          title="Shared Media" 
          isOpen={expandedSections.includes('media')} 
          onToggle={() => toggleSection('media')}
        >
           {sharedMedia.length > 0 ? (
             <div className="grid grid-cols-3 gap-2 pt-4">
               {sharedMedia.map((msg, i) => (
                 <div key={msg.id || i} className="aspect-square rounded-xl bg-bg-card overflow-hidden relative group cursor-pointer border border-border-base">
                   <img 
                    src={getMediaUrl(msg.media_url)} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                   />
                 </div>
               ))}
             </div>
           ) : (
             <div className="pt-6 pb-2 text-center">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">No media shared yet</p>
             </div>
           )}
           
           {sharedMedia.length > 0 && (
             <button className="w-full mt-4 py-2 text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-[0.2em] italic text-right">
                View All Media →
             </button>
           )}
        </SidebarSection>
      </div>
    </div>
  );
};

const SidebarSection = ({ title, isOpen, onToggle, children }: any) => (
  <div className="pb-4">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-[0.2em] group outline-none"
    >
      <span className="group-hover:text-text-base transition-colors">{title}</span>
      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
    {isOpen && <div>{children}</div>}
  </div>
);

const InfoItem = ({ label, value, icon }: any) => (
  <div className="flex flex-col space-y-1">
    <div className="flex items-center gap-1.5 opacity-50">
       {icon}
       <span className="text-[9px] font-black text-text-muted uppercase tracking-tight">{label}</span>
    </div>
    <div className="text-[12px] text-text-base font-bold pl-4.5">
       {value}
    </div>
  </div>
);

export default ChatProfileSidebar;
