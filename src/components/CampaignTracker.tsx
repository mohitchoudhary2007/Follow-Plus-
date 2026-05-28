import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, RefreshCw, Layers, CheckCircle, Clock, Heart, Users, Eye, HelpCircle } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignTrackerProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

export default function CampaignTracker({ campaigns, onRefresh }: CampaignTrackerProps) {
  const [activeLogCampaignId, setActiveLogCampaignId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ [campaignId: string]: string[] }>({});

  // Periodically refresh campaigns list from parents
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 4000); // Poll server state every 4 seconds to update progress counters!
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Set default active log view to the first campaign found
  useEffect(() => {
    if (campaigns.length > 0 && !activeLogCampaignId) {
      setActiveLogCampaignId(campaigns[0].id);
    }
  }, [campaigns, activeLogCampaignId]);

  // Generate dynamic progressive logs based on individual campaign progression
  useEffect(() => {
    const newLogs: { [id: string]: string[] } = {};

    campaigns.forEach((c) => {
      const logsArray: string[] = [];
      const now = Date.now();
      const elapsedSec = (now - c.createdAt) / 1000;

      // Base initialization logs
      logsArray.push(`[SYSTEM_CONN] Establish linkup socket for verified user @${c.username}`);
      logsArray.push(`[SYSTEM_SYNC] Proxy handshake complete. Node latency: ${Math.floor(Math.random() * 25) + 12}ms`);
      logsArray.push(`[SYSTEM_TARGET] Target demographic filter verified (Niche loops OK)`);

      if (c.type === 'free_followers_trial') {
        logsArray.push(`[CAMPAIGN_INFO] Free 8-Days Trial registered. Delivering 100 followers / day.`);
        
        // Simulating Day progress
        const computedDaysElapsed = Math.min(8, Math.floor(elapsedSec / 20) + 1); // lets accelerate day for simulation
        logsArray.push(`[CAMPAIGN_STATE] Cycle status: Day ${computedDaysElapsed} of 8 active.`);

        if (c.deliveredAmount > 0) {
          logsArray.push(`[CAMPAIGN_BATCH] Dispatched morning demographic batch correctly to @${c.username}`);
          logsArray.push(`[CAMPAIGN_DELIV] Transferred ${c.deliveredAmount} of ${c.targetAmount} organic profiles.`);
        }
      } else {
        logsArray.push(`[CAMPAIGN_INFO] Premium Boost activated. Fast velocity queue.`);
        if (c.postLink) {
          logsArray.push(`[CAMPAIGN_LINK] Verified media node: ${c.postLink.substring(0, 30)}...`);
        }
        if (c.deliveredAmount > 0) {
          logsArray.push(`[CAMPAIGN_BATCH] Dispatched premium demographic streams.`);
          logsArray.push(`[CAMPAIGN_DELIV] Transferred ${c.deliveredAmount} of ${c.targetAmount} organic profiles.`);
        }
      }

      if (c.status === 'completed') {
        logsArray.push(`[CAMPAIGN_SUCCESS] Total task payload of ${c.targetAmount} fully integrated into profile.`);
        logsArray.push(`[SYSTEM_CONN] Socket closed safely. Terminated proxy thread.`);
      } else {
        const remaining = c.targetAmount - c.deliveredAmount;
        logsArray.push(`[CAMPAIGN_PEND] Dispatch loop active. ${remaining} elements remaining in pipeline buffer.`);
      }

      newLogs[c.id] = logsArray;
    });

    setLogs(newLogs);
  }, [campaigns]);

  const getCampaignIcon = (type: string) => {
    if (type === 'likes') return <Heart className="w-4 h-4 text-[#dfb24c]" />;
    if (type === 'views') return <Eye className="w-4 h-4 text-[#fcd34d]" />;
    return <Users className="w-4 h-4 text-[#dfb24c]" />;
  };

  const getFriendlyType = (type: string) => {
    if (type === 'free_followers_trial') return '8-Days Free Followers Trial';
    if (type === 'followers') return 'Premium Followers Boost';
    if (type === 'likes') return 'Instant Location Likes';
    if (type === 'views') return 'Reels Video Stream Spark';
    return type;
  };

  return (
    <div className="premium-card rounded-2xl p-6 lg:p-8 border border-white/10 relative shadow-sm">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-medium text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#dfb24c]" />
            Live Delivery Console
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 font-sans">
            Monitor real-time progress indicators, delivered metrics, and network telemetry logs.
          </p>
        </div>

        <button 
          onClick={onRefresh}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all pointer-events-auto cursor-pointer"
          title="Force telemetry poll"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-white/10 rounded-xl bg-black/20">
          <Clock className="w-8 h-8 text-slate-650 mb-3" />
          <p className="text-slate-400 text-sm font-medium font-sans">No live Campaigns running</p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs font-sans">
            Submit a Free 8-Day Followers Trial above to instantly connect your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-scale">
          {/* Active List */}
          <div className="space-y-4">
            {campaigns.map((c) => {
              const pct = Math.min(100, Math.floor((c.deliveredAmount / c.targetAmount) * 100));
              const isActive = activeLogCampaignId === c.id;
              
              return (
                <div 
                  key={c.id}
                  onClick={() => setActiveLogCampaignId(c.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer pointer-events-auto relative overflow-hidden flex flex-col gap-4 ${
                    isActive 
                      ? 'bg-[#0e111a]/75 border-[#dfb24c]/30 shadow-lg shadow-[#dfb24c]/5' 
                      : 'bg-[#0e111a]/40 border-white/5 hover:border-white/10 hover:bg-[#0e111a]/60'
                  }`}
                >
                  {/* Campaign summary descriptor bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        {getCampaignIcon(c.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">@{c.username}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({c.id})</span>
                        </div>
                        <span className="text-xs text-slate-400 block">{getFriendlyType(c.type)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <span className="text-[10px] font-mono bg-black px-2 py-0.5 rounded border border-white/15 text-slate-350 leading-normal uppercase">
                        {c.status}
                      </span>
                      {c.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#dfb24c] animate-pulse shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Progressive bar animation */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Decentralized Delivery progress</span>
                      <span className="text-white">
                        {c.deliveredAmount.toLocaleString()} / {c.targetAmount.toLocaleString()}{' '}
                        <span className="text-luxury-gradient font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#dfb24c] via-[#f4d081] to-[#dfb24c] rounded-full"
                      />
                    </div>
                  </div>

                  {/* SPECIAL CALENDAR LAYOUT FOR FREE 8 DAYS TRIAL */}
                  {c.type === 'free_followers_trial' && (
                    <div className="mt-2 pt-4 border-t border-white/10 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-450 flex items-center gap-1 font-mono uppercase tracking-wider text-[11px]">
                          📅 8-Day followers scheduler Timeline
                        </span>
                        <span className="text-[11px] font-mono text-[#dfb24c] font-medium uppercase tracking-wider">100 Followers / day</span>
                      </div>
                      
                      {/* Grid representation for 8 distinct calendar blocks */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                        {Array.from({ length: 8 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          
                          // Accelerated simulation formula to showcase progressive Day shifts in UI
                          const elapsedSec = (Date.now() - c.createdAt) / 1000;
                          const activeDay = Math.min(8, Math.floor(elapsedSec / 20) + 1); // 20 seconds = 1 Day simulated
                          
                          const isDone = dayNum < activeDay || c.status === 'completed';
                          const isCurrent = dayNum === activeDay && c.status === 'active';
                          
                          return (
                            <div 
                              key={idx}
                              className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                                isDone 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                                  : isCurrent 
                                    ? 'bg-[#dfb24c]/10 border-[#dfb24c]/40 text-amber-250 animate-pulse' 
                                    : 'bg-black/30 border-white/5 text-slate-600'
                              }`}
                            >
                              <span className="text-[9px] font-mono tracking-wider font-bold block uppercase">Day {dayNum}</span>
                              <span className="text-xs font-bold mt-1 block">
                                {isDone ? "✓" : isCurrent ? "100" : "100"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal italic text-right font-mono">
                        *Note: Interactive simulation runs at accelerated rate for active monitoring.
                      </p>
                    </div>
                  )}

                  {/* Selected Log Console Drawer inside card */}
                  {isActive && logs[c.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-4 border-t border-white/10 space-y-2"
                      onClick={(e) => e.stopPropagation()} // retain tab selectors clicking inside logs
                    >
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Terminal className="w-3.5 h-3.5 text-[#dfb24c]" />
                        <span>INTEGRATED SYSTEM DIAGNOSTICS LOGS</span>
                      </div>
                      
                      <div className="bg-black/80 font-mono text-[10px] text-slate-400 p-3 rounded-xl border border-white/5 space-y-1 overflow-y-auto max-h-36 shadow-inner select-text">
                        {logs[c.id].map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-[#8b5cf6] font-bold shrink-0">&gt;</span>
                            <span className="leading-relaxed hover:text-white transition-colors">
                              {log}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
