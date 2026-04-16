import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Zap, Ghost, Flame, Users, Star } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const features = [
  { icon: <MapPin className="w-6 h-6 text-violet-400" />, title: 'Heatmap', desc: 'See local vibes in real-time' },
  { icon: <Star className="w-6 h-6 text-pink-400" />, title: 'Stories', desc: '24h local moments' },
  { icon: <Users className="w-6 h-6 text-blue-400" />, title: 'Crossings', desc: 'Paths that cross, connect' },
  { icon: <Ghost className="w-6 h-6 text-emerald-400" />, title: 'Ghost Mode', desc: 'Invisible when you want' },
  { icon: <Flame className="w-6 h-6 text-orange-400" />, title: 'Panic Mode', desc: 'Instant data wipe' },
  { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: 'Discover', desc: 'Find what happens near you' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-[#f9e8ff] text-black font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 border-b border-primary/5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <MapPin className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-black tracking-tight text-black">Locolive</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-5 py-2 text-sm font-medium text-black/60 hover:text-black transition-colors"
          >
            Login
          </button>
          <button
            onClick={onSignup}
            className="px-5 py-2 text-sm font-bold bg-primary hover:opacity-90 text-black rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs text-black/60 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Privacy First · Location Based · Real Connections
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 max-w-3xl text-black">
            Discover What&apos;s{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Happening
            </span>
            <br />Around You
          </h1>

          <p className="text-black/60 max-w-xl mx-auto leading-relaxed text-base md:text-lg mb-10">
            Explore local stories, spot area hotspots on the heatmap, and connect with people crossing
            your path — all while staying completely in control of your privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignup}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-primary to-accent text-black font-bold rounded-full shadow-xl shadow-primary/25 hover:opacity-90 transition-all active:scale-95"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary/5 text-black font-bold rounded-full border border-primary/10 hover:bg-primary/10 transition-all active:scale-95"
            >
              Explore Map
            </button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-20 w-full max-w-3xl"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all text-left"
            >
              {f.icon}
              <p className="font-bold text-sm mt-1 text-black">{f.title}</p>
              <p className="text-xs text-black/60">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-black/40 border-t border-primary/5">
        © 2026 Locolive · Privacy-first social discovery
      </footer>
    </div>
  );
};

export default LandingPage;
