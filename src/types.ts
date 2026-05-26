export type CampaignType = 'free_followers_trial' | 'followers' | 'likes' | 'views';

export interface Campaign {
  id: string;
  username: string;
  password?: string;
  type: CampaignType;
  status: 'active' | 'completed' | 'paused';
  targetAmount: number;
  deliveredAmount: number;
  startDate: string;
  daysDuration?: number;
  postLink?: string;
  createdAt: number;
}

export interface GrowthStrategy {
  isFallback?: boolean;
  accountScore: number;
  competitorBenchmarks: {
    averageEngagementRate: string;
    topCompetitorTags: string[];
  };
  criticalActionItems: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    impactMetric: 'Reach' | 'Algorithm Match' | 'Bio Optimize' | 'Conversion' | string;
  }>;
  viralContentIdeas: Array<{
    hook: string;
    body: string;
    postType: 'Reels' | 'Carousel' | 'Story Series' | string;
    suggestedAudioStyle: string;
  }>;
  hashtagStrategy: string[];
  recommendedPostingSchedule: Array<{
    day: string;
    bestTime: string;
    reason: string;
  }>;
  algorithmSecretHack: string;
}

export interface ClientProfile {
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}
