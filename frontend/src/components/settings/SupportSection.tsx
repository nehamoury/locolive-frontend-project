import { type FC, useState } from 'react';
import {
  Send, Loader2, AlertCircle,
  UserCircle, ShieldCheck, HelpCircle,
  ChevronRight, ArrowLeft, Image as ImageIcon,
  CheckCircle2, Sparkles, Search,
  BookOpen, FileText, PlayCircle, Users, Mail
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import api from '../../services/api';
import { cn } from '../../utils/helpers';

interface Category {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  faqs: { q: string; a: string }[];
}

const CATEGORIES: Category[] = [
  {
    id: 'problem',
    label: 'Report a Problem',
    desc: 'Report bugs, crashes or technical glitches.',
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-red-500 bg-red-50 dark:bg-red-500/10',
    faqs: [
      { q: "App is crashing frequently", a: "Please try clearing your browser cache or updating the app to the latest version." },
      { q: "Photos are not loading", a: "Check your internet connection or try refreshing the page." }
    ]
  },
  {
    id: 'account',
    label: 'Account Issues',
    desc: 'Login, password or profile help.',
    icon: <UserCircle className="w-6 h-6" />,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    faqs: [
      { q: "How do I change my username?", a: "Go to Account Information section in settings to change your username." },
      { q: "I can't verify my email", a: "Check your spam folder or click 'Resend' in the account settings." }
    ]
  },
  {
    id: 'privacy',
    label: 'Privacy & Safety',
    desc: 'Blocking, safety and visibility settings.',
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
    faqs: [
      { q: "How to block someone?", a: "Visit the user's profile and click the three dots menu to find the block option." },
      { q: "Is my location always public?", a: "No, you can enable Ghost Mode in Privacy settings to hide your location." }
    ]
  },
  {
    id: 'other',
    label: 'General Help',
    desc: 'Explore answers to common questions.',
    icon: <HelpCircle className="w-6 h-6" />,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    faqs: [
      { q: "How to contact partnership team?", a: "Please select this category and submit a ticket with 'Partnership' as subject." },
      { q: "Feature request", a: "We love feedback! Tell us what you'd like to see in Locolive." }
    ]
  }
];

const SupportSection: FC = () => {
  const { mutations } = useSettings();
  const [step, setStep] = useState(1); // 1: Category, 2: FAQs, 3: Form
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [ticket, setTicket] = useState({ subject: '', description: '', priority: 'medium' });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setTicket(t => ({ ...t, subject: cat.label }));
    setStep(3); // Jump straight to form for better UX
  };

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ticket.subject.length < 5) {
      import('react-hot-toast').then(({ toast }) => toast.error('Subject must be at least 5 characters'));
      return;
    }
    if (ticket.description.length < 20) {
      import('react-hot-toast').then(({ toast }) => toast.error('Description must be at least 20 characters'));
      return;
    }

    setUploading(true);
    try {
      let finalDescription = ticket.description;
      
      // If there's a screenshot, upload it first
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        const { data } = await api.post('/upload', formData);
        finalDescription += `\n\n[Attachment: ${data.url}]`;
      }

      mutations.submitSupportTicket.mutate({ ...ticket, description: finalDescription }, {
        onSuccess: () => {
          setStep(1);
          setTicket({ subject: '', description: '', priority: 'medium' });
          setScreenshot(null);
          import('react-hot-toast').then(({ toast }) => toast.success('Ticket submitted! We will get back to you soon.'));
        }
      });
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to upload image. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.faqs.some(faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-bg-base rounded-xl transition-colors cursor-pointer -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-[28px] sm:text-[32px] font-black text-text-base tracking-tight flex items-center gap-2 leading-none">
              Help Center <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 shrink-0" />
            </h1>
          </div>
          <p className="text-[13px] sm:text-[14px] text-text-muted font-bold opacity-70 leading-tight">Choose a topic to get started.</p>
        </div>

        {step === 1 && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-card border border-border-base/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-text-base outline-none focus:border-pink-500/30 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-12 animate-in fade-in duration-500">
          {/* Popular Topics Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[15px] font-black text-text-base">Popular Topics</h3>
              <button className="text-[13px] font-black text-pink-500 hover:underline flex items-center gap-1">
                View all topics <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 px-1 sm:px-0">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="flex items-center gap-4 sm:gap-6 p-4 bg-bg-card rounded-[28px] sm:rounded-[32px] border border-border-base/50 hover:border-pink-500/20 hover:shadow-xl transition-all group cursor-pointer text-left"
                  >
                    <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[24px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", cat.color)}>
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[15px] sm:text-[17px] font-black text-text-base tracking-tight mb-0.5 sm:mb-1 leading-none">{cat.label}</h4>
                      <p className="text-[12px] sm:text-[13px] text-text-muted font-bold leading-tight opacity-70">{cat.desc}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-bg-base flex items-center justify-center border border-border-base/30 group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-500 transition-all shrink-0">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-bg-card rounded-[32px] border border-border-base/50 border-dashed">
                <Search className="w-12 h-12 text-text-muted/20 mb-4" />
                <h4 className="text-[17px] font-black text-text-base">No results for "{searchQuery}"</h4>
                <p className="text-[13px] text-text-muted font-bold opacity-70">Try searching for different keywords or browse topics.</p>
              </div>
            )}
          </div>

          {/* Need More Help Banner */}
          <div className="bg-bg-card rounded-[32px] border border-border-base/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mx-1 sm:mx-0">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-[17px] sm:text-[18px] font-black text-text-base tracking-tight leading-none mb-1">Need more help?</h4>
                <p className="text-[13px] sm:text-[14px] text-text-muted font-bold opacity-70 leading-tight">Contact our support team anytime.</p>
              </div>
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full sm:w-auto px-8 py-4 bg-[#ff3399] text-white text-[13px] font-black uppercase rounded-2xl hover:bg-[#ff1a8c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" /> Contact Support
            </button>
          </div>

          {/* Bottom Resources */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { label: 'Helpful Resources', desc: 'Guides and tips', icon: <BookOpen className="w-5 h-5" /> },
              { label: 'Help Articles', desc: 'Browse guides', icon: <FileText className="w-5 h-5" /> },
              { label: 'Video Tutorials', desc: 'Watch and learn', icon: <PlayCircle className="w-5 h-5" /> },
              { label: 'Community', desc: 'Get help from others', icon: <Users className="w-5 h-5" /> }
            ].map((res, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-bg-card rounded-2xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center shrink-0 border border-border-base/50 group-hover:border-pink-500/30 transition-all text-pink-500">
                  {res.icon}
                </div>
                <div>
                  <h5 className="text-[13px] font-black text-text-base leading-tight">{res.label}</h5>
                  <p className="text-[11px] text-text-muted font-bold leading-tight mt-0.5">{res.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: FAQs */}
      {step === 2 && selectedCategory && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-bg-card rounded-[32px] border border-border-base/50 overflow-hidden divide-y divide-border-base/30">
            {selectedCategory.faqs.map((faq, i) => (
              <div key={i} className="p-8 space-y-3 hover:bg-bg-base/30 transition-colors">
                <h4 className="text-[17px] font-black text-text-base tracking-tight">{faq.q}</h4>
                <p className="text-[14px] text-text-muted font-bold leading-relaxed opacity-80">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <button
              onClick={() => setStep(3)}
              className="text-pink-500 font-black text-[14px] hover:underline"
            >
              Still need help? Talk to our team
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Form */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto bg-bg-card rounded-[40px] border border-border-base/50 shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Subject</label>
              <input
                type="text"
                value={ticket.subject}
                onChange={e => setTicket(t => ({ ...t, subject: e.target.value }))}
                className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-6 py-4 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all"
                placeholder="Briefly describe the issue"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Description</label>
              <textarea
                rows={5}
                value={ticket.description}
                onChange={e => setTicket(t => ({ ...t, description: e.target.value }))}
                className={`w-full bg-bg-base/50 border rounded-2xl px-6 py-4 text-sm font-bold text-text-base outline-none transition-all resize-none ${
                  ticket.description.length > 0 && ticket.description.length < 20 ? 'border-red-500/30' : 'border-border-base/50 focus:border-pink-500/50'
                }`}
                placeholder="How can we help you today?"
              />
              <div className="flex justify-between px-1">
                <p className={`text-[10px] font-bold ${ticket.description.length < 20 ? 'text-red-500' : 'text-green-500'}`}>
                  {ticket.description.length < 20 ? `Min 20 characters required (${20 - ticket.description.length} more)` : 'Length requirement met'}
                </p>
                <span className="text-[10px] font-black text-text-muted/50">{ticket.description.length} chars</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Attach Image</label>
              <label className="flex flex-col items-center justify-center w-full h-32 bg-bg-base/20 border-2 border-dashed border-border-base/50 rounded-3xl cursor-pointer hover:border-pink-500/30 transition-all group">
                {screenshot ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="text-sm font-bold">{screenshot.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-text-muted/30 group-hover:text-pink-500 transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-text-muted/50">Upload Proof</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
              </label>
            </div>

            <button
              type="submit"
              disabled={mutations.submitSupportTicket.isPending || uploading || ticket.description.length < 20}
              className={`w-full py-5 text-white text-[15px] font-black uppercase rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${
                (mutations.submitSupportTicket.isPending || uploading || ticket.description.length < 20) 
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-[#ff3399] hover:bg-[#ff1a8c] shadow-pink-500/20'
              }`}
            >
              {(mutations.submitSupportTicket.isPending || uploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Send className="w-5 h-5" />
                  Send Support Ticket
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportSection;
