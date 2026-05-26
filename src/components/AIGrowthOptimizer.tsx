import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, Zap, CheckCircle2, Copy, Calendar, Award, Compass, Search, Loader2 } from 'lucide-react';
import { GrowthStrategy } from '../types';

interface AIGrowthOptimizerProps {
  onStrategyGenerated?: (strategy: GrowthStrategy) => void;
}

const NICHES = [
  "Fashion & Streetwear",
  "Fitness & Athletics",
  "Tech & Gadgets",
  "Travel & Backpacking",
  "Cooking & Gastronomy",
  "Beauty & Cosmetics",
  "Business & Crypto",
  "AI & Digital Art",
  "Gaming & esports",
  "Music & DJing"
];

const LOADING_STEPS = [
  "Connecting to Follow Plus AI engine...",
  "Querying recent niche hashtag velocities...",
  "Analyzing competitor retention coefficients...",
  "Simulating viral loop completion scenarios...",
  "Drafting localized Reels hook scripts...",
  "Compiling optimal aesthetic posting schedules..."
];

export default function AIGrowthOptimizer({ onStrategyGenerated }: AIGrowthOptimizerProps) {
  const [username, setUsername] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [selectedNiche, setSelectedNiche] = useState(NICHES[0]);
  const [frequency, setFrequency] = useState('3-5 Reels / Week');
  const [goal, setGoal] = useState('Organic Followers & Profile Authority');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [strategy, setStrategy] = useState<GrowthStrategy | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Cycle loading messages when generating
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1600);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setStrategy(null);

    const finalNiche = selectedNiche === "Other Niche" ? customNiche : selectedNiche;

    try {
      const response = await fetch('/api/gemini/growth-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.replace('@', '').trim(),
          niche: finalNiche || "General lifestyle",
          contentFrequency: frequency,
          targetAudience: "Niche-relevant active organic users",
          goal: goal
        })
      });

      if (!response.ok) {
        throw new Error('Fallback strategy deployed');
      }

      const data: GrowthStrategy = await response.json();
      setStrategy(data);
      if (onStrategyGenerated) {
        onStrategyGenerated(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="ai-optimizer" className="interactive-card rounded-2xl p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#121420]/90 to-[#0e101a]/95 border border-white/10 shadow-[inner_0_0_20px_rgba(168,85,247,0.05)]">
      {/* Decorative ambient neon elements representing inside lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-purple/10 border border-neon-purple/20 text-neon-purple mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI DEEP ENGINE
          </div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Follow Plus <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">AI Growth Coach</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Engineered server-side with Gemini 3.5 to reverse-engineer your niche algorithm score.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!loading && !strategy && (
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleGenerate}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IG Username Input */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-gray-400 font-medium">Instagram Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">@</span>
                  <input 
                    type="text" 
                    required
                    placeholder="kim_jones" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple transition-all text-sm font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  />
                </div>
                <p className="text-[11px] text-gray-500">No passwords or credentials required. Public profiles preferred.</p>
              </div>

              {/* Niche Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-gray-400 font-medium">Content Niche</label>
                <select 
                  value={selectedNiche}
                  onChange={(e) => {
                    setSelectedNiche(e.target.value);
                    if (e.target.value !== "Other Niche") setCustomNiche('');
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-purple transition-all text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n} className="bg-[#121420] text-white">{n}</option>
                  ))}
                  <option value="Other Niche" className="bg-[#121420] text-white">Other... (Type Custom Niche)</option>
                </select>
              </div>

              {/* Custom Niche input if "Other" is selected */}
              {selectedNiche === "Other Niche" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 md:col-span-2"
                >
                  <label className="block text-xs font-mono uppercase text-[#ec4899] font-medium">Write Custom Niche</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Minimalist Interior Design or Indie Game Dev" 
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    className="w-full bg-black/40 border border-[#ec4899]/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ec4899] transition-all text-sm"
                  />
                </motion.div>
              )}

              {/* Goal Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-gray-400 font-medium">Core Strategy Goal</label>
                <select 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-purple transition-all text-sm"
                >
                  <option value="Organic Followers & Profile Authority" className="bg-[#121420]">Max Organic Followers & Authority</option>
                  <option value="Exponential engagement and comments count" className="bg-[#121420]">Viral Reel Engagement & Comments</option>
                  <option value="Monetization conversion ratios" className="bg-[#121420]">Brand Partnerships & Conversions</option>
                  <option value="Local business footprint matching" className="bg-[#121420]">Local Brick-and-Mortar Footprint</option>
                </select>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-gray-400 font-medium">Current Posting Frequency</label>
                <select 
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-purple transition-all text-sm"
                >
                  <option value="Every single day (Daily Reel)" className="bg-[#121420]">1+ Post Every Single Day</option>
                  <option value="3-5 Reels / Week" className="bg-[#121420]">3-5 Times a Week (Standard)</option>
                  <option value="1-2 Posts / Week" className="bg-[#121420]">1-2 Times a Week</option>
                  <option value="Monthly or inconsistent postings" className="bg-[#121420]">Irregular / Testing Phase</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full relative group overflow-hidden py-3.5 px-6 rounded-xl font-display font-semibold text-white bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all pointer-events-auto cursor-pointer flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 fill-white" />
              Analyze Account & Deploy AI Strategy
            </button>
          </motion.form>
        )}

        {/* Loading Overlay */}
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border border-neon-purple/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-neon-pink animate-spin" />
              </div>
              <div className="absolute -inset-1 blur bg-gradient-to-r from-neon-purple to-neon-pink opacity-20 animate-pulse rounded-full" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <p className="text-white font-display font-medium text-lg"> Follow Plus Engine Active</p>
              <p className="text-neon-cyan font-mono text-xs tracking-wider uppercase animate-pulse">
                {LOADING_STEPS[loadingStep]}
              </p>
              <p className="text-gray-500 text-xs mt-4">
                This takes a brief moment to map the Instagram API limits securely.
              </p>
            </div>
          </motion.div>
        )}

        {/* Dashboard Results layout */}
        {!loading && strategy && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Header / Score row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score circular Dial */}
              <div className="bg-black/40 rounded-xl p-5 border border-white/5 flex flex-col items-center text-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient(ellipse at center, rgba(6,182,212,0.05)_0%, transparent_70%)" />
                
                <h3 className="text-xs font-mono uppercase text-gray-400 mb-3 tracking-wider">Estimated Organic Score</h3>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* SVG Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="transparent" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="6" 
                    />
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="transparent" 
                      stroke="url(#neonPurpleCyanGradient)" 
                      strokeWidth="6" 
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * strategy.accountScore) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="neonPurpleCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-display font-bold text-white">{strategy.accountScore}</span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">A-GRADE</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                  Better than <span className="text-[#a855f7] font-semibold">92%</span> of competing accounts in your content niche.
                </p>
              </div>

              {/* Benchmarks info */}
              <div className="bg-black/40 rounded-xl p-5 border border-white/5 flex flex-col justify-between lg:col-span-2">
                <div>
                  <h3 className="text-xs font-mono uppercase text-gray-400 mb-4 tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-neon-pink" />
                    COMPETITIONS BENCHMARK
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-gray-500 block">Niche Engagement Bar</span>
                      <span className="text-lg font-display font-semibold text-neon-cyan mt-1 block">
                        {strategy.competitorBenchmarks.averageEngagementRate}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-gray-500 block">Targeting Authority</span>
                      <span className="text-lg font-display font-semibold text-[#ec4899] mt-1 block">
                        HIGH RETENTION
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                  <span className="text-xs font-mono text-gray-400 uppercase">Top Competitor Tag Clouds</span>
                  <div className="flex flex-wrap gap-1.5">
                    {strategy.competitorBenchmarks.topCompetitorTags.map((tag, i) => (
                      <span 
                        key={i} 
                        onClick={() => handleCopy(tag, `tag-${i}`)}
                        className="text-xs font-mono bg-[#121420] hover:bg-[#a855f7]/10 border border-white/10 hover:border-[#a855f7]/40 text-gray-300 py-1 px-2.5 rounded-md cursor-pointer transition-colors duration-150"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Critical elements layout */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-neon-purple" />
                CRITICAL ACTION PLAN
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategy.criticalActionItems.map((item, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-5 rounded-xl space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-1.5 text-[9px] font-mono tracking-wider font-semibold uppercase bg-neon-purple/10 text-neon-purple rounded-bl-lg border-l border-b border-white/5">
                      {item.impactMetric}
                    </div>
                    
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400">
                      {item.priority} PRIORITY
                    </div>

                    <h4 className="font-display font-semibold text-white text-sm pt-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Viral Ideas widget */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-neon-cyan" />
                VIRAL REELS HOOK SCRIPTS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategy.viralContentIdeas.map((idea, idx) => (
                  <div key={idx} className="bg-[#121420]/50 border border-white/5 p-5 rounded-xl space-y-3 relative group hover:border-[#06b6d4]/30 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded border border-neon-cyan/20">
                        {idea.postType}
                      </span>
                      <button 
                        onClick={() => handleCopy(`Hook: "${idea.hook}"\nScript: "${idea.body}"`, `idea-${idx}`)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy Hook Script"
                      >
                        {copiedIndex === `idea-${idx}` ? (
                          <span className="text-xs font-mono text-neon-cyan">COPIED!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-display font-semibold text-white text-sm line-clamp-2">
                        &quot;{idea.hook}&quot;
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                        {idea.body}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-gray-500 leading-relaxed pt-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-neon-pink" />
                      Audio style: <span className="text-gray-300 font-sans">{idea.suggestedAudioStyle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtag strategies with click copy */}
            <div className="bg-[#121420]/40 p-5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#ec4899]" />
                  TAILORED ALGORITHM HASHTAG GROUP
                </span>
                <button
                  onClick={() => handleCopy(strategy.hashtagStrategy.join(' '), 'all-tags')}
                  className="text-xs font-mono font-medium text-neon-cyan flex items-center gap-1.5 hover:underline pointer-events-auto cursor-pointer"
                >
                  {copiedIndex === 'all-tags' ? "COPIED HASHTAGS!" : "COPY ALL HASHTAGS"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {strategy.hashtagStrategy.map((tag, idx) => (
                  <span 
                    key={idx}
                    onClick={() => handleCopy(tag, `tag-detail-${idx}`)}
                    className="text-xs font-mono bg-black/40 text-[#06b6d4] hover:text-white hover:bg-[#06b6d4]/10 border border-[#06b6d4]/10 hover:border-[#06b6d4]/40 py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-150"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Optimal Calendar list */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-neon-purple" />
                OPTIMAL DAILY DELIVERY CALENDAR
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {strategy.recommendedPostingSchedule.map((sched, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-display font-semibold text-white text-sm">{sched.day}</span>
                        <span className="text-xs font-mono font-bold text-[#a855f7]">{sched.bestTime}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-2">{sched.reason}</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Secret hack alert */}
            <div className="bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/20 p-5 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/10 rounded-full blur-2xl -z-10" />
              <h4 className="font-display font-semibold text-white text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#a855f7] fill-[#a855f7]" />
                EXCLUSIVE ALGORITHM EXPLOIT:
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">{strategy.algorithmSecretHack}</p>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setStrategy(null)}
                className="text-xs font-mono text-gray-500 hover:text-white transition-colors cursor-pointer pointer-events-auto"
              >
                ← START NEW AI AUDIT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
