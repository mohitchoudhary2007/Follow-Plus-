import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI-powered strategy generation will fall back to dynamic smart templates.");
      throw new Error("GEMINI_API_KEY is missing");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Firebase configuration setup
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const appFirebase = initializeApp(firebaseConfig);
    db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully with database:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("WARNING: firebase-applet-config.json not found. Falling back to in-memory store.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
}

// Error Handling according to Firebase Integration Skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Campaign Interface definition
interface Campaign {
  id: string;
  username: string;
  password?: string;
  type: 'free_followers_trial' | 'followers' | 'likes' | 'views';
  status: 'active' | 'completed' | 'paused';
  targetAmount: number;
  deliveredAmount: number;
  startDate: string;
  daysDuration?: number;
  postLink?: string;
  createdAt: number;
}

// In-memory campaign storage fallback
const campaigns: Campaign[] = [
  {
    id: "global-1",
    username: "alex_travels",
    type: 'likes',
    status: 'active',
    targetAmount: 500,
    deliveredAmount: 432,
    startDate: new Date(Date.now() - 3600000).toISOString(),
    postLink: "https://instagram.com/p/C9x81aB8x/",
    createdAt: Date.now() - 3600000
  },
  {
    id: "global-2",
    username: "fit_lifestyle_guru",
    type: 'followers',
    status: 'active',
    targetAmount: 2500,
    deliveredAmount: 1845,
    startDate: new Date(Date.now() - 10800000).toISOString(),
    createdAt: Date.now() - 10800000
  },
  {
    id: "global-3",
    username: "urban_street_wear",
    type: 'views',
    status: 'completed',
    targetAmount: 10000,
    deliveredAmount: 10000,
    startDate: new Date(Date.now() - 86400000).toISOString(),
    postLink: "https://instagram.com/reel/C8r41mN8x/",
    createdAt: Date.now() - 86400000
  }
];

// Seed initial campaigns if database is empty
async function seedCampaignsIfEmpty() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, "campaigns"));
    if (snap.empty) {
      console.log("Seeding Firestore campaigns database with initial data feeds...");
      for (const c of campaigns) {
        await setDoc(doc(db, "campaigns", c.id), c);
      }
    }
  } catch (err) {
    console.warn("Error seeding Firestore campaigns:", err);
  }
}
seedCampaignsIfEmpty();

// Database read/write functions
async function getFirestoreCampaigns(): Promise<Campaign[]> {
  if (!db) {
    return campaigns;
  }
  try {
    const snap = await getDocs(collection(db, "campaigns"));
    const list: Campaign[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push(data as Campaign);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "campaigns");
    return campaigns;
  }
}

async function addFirestoreCampaign(c: Campaign) {
  if (!db) {
    campaigns.unshift(c);
    return;
  }
  try {
    await setDoc(doc(db, "campaigns", c.id), c);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `campaigns/${c.id}`);
  }
}

async function deleteFirestoreCampaign(id: string) {
  if (!db) {
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns.splice(index, 1);
    }
    return;
  }
  try {
    await deleteDoc(doc(db, "campaigns", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`);
  }
}

// Helper to calculate progress on server
async function getUpdatedCampaigns(): Promise<Campaign[]> {
  const currentCampaigns = await getFirestoreCampaigns();
  const now = Date.now();
  return currentCampaigns.map(c => {
    if (c.status === 'completed') return c;
    
    // Calculate simulated progress based on time elapsed since creation
    const elapsedSeconds = (now - c.createdAt) / 1000;
    
    if (c.type === 'free_followers_trial') {
      const deliveryRatePerSecond = 0.5; // 1 follower every 2 seconds
      const simulatedDelivered = Math.min(c.targetAmount, Math.floor(elapsedSeconds * deliveryRatePerSecond));
      const isDone = simulatedDelivered >= c.targetAmount;
      return {
        ...c,
        deliveredAmount: simulatedDelivered,
        status: isDone ? 'completed' : 'active' as const
      };
    } else {
      const deliveryRatePerSecond = c.targetAmount / 300; // completes in 5 minutes
      const simulatedDelivered = Math.min(c.targetAmount, Math.floor(elapsedSeconds * deliveryRatePerSecond));
      const isDone = simulatedDelivered >= c.targetAmount;
      return {
        ...c,
        deliveredAmount: simulatedDelivered,
        status: isDone ? 'completed' : 'active' as const
      };
    }
  });
}

// REST APIs
// 1. Submit campaign
app.post("/api/campaigns", async (req, res) => {
  const { username, password, type, targetAmount, postLink, daysDuration, status } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Instagram username is required." });
  }

  // Double check if same username already has an active Free Trial to prevent abuse
  if (type === 'free_followers_trial' && status !== 'paused') {
    const list = await getFirestoreCampaigns();
    const hasActiveTrial = list.some(
      c => c.username.toLowerCase() === username.toLowerCase() && c.type === 'free_followers_trial' && c.status === 'active'
    );
    if (hasActiveTrial) {
      return res.status(400).json({ 
        error: "This Instagram profile already has an activated 8-Days Free Trial pack. You can only activate one free trial per Instagram account." 
      });
    }
  }

  const newCampaign: Campaign = {
    id: `campaign-${Date.now()}`,
    username: username.replace("@", "").trim(),
    password: password || undefined,
    type,
    status: status || 'active',
    targetAmount: Number(targetAmount) || 100,
    deliveredAmount: 0,
    startDate: new Date().toISOString(),
    daysDuration: daysDuration ? Number(daysDuration) : undefined,
    postLink: postLink || undefined,
    createdAt: Date.now()
  };

  await addFirestoreCampaign(newCampaign);
  res.status(201).json(newCampaign);
});

// 2. Get all campaigns (includes active simulation)
app.get("/api/campaigns", async (req, res) => {
  const refreshed = await getUpdatedCampaigns();
  res.json(refreshed);
});

// 3. Get single campaign status
app.get("/api/campaigns/:id", async (req, res) => {
  const updated = await getUpdatedCampaigns();
  const found = updated.find(c => c.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: "Campaign not found." });
  }
  res.json(found);
});

// 3.5 Delete Campaign (Admin exclusive)
app.delete("/api/campaigns/:id", async (req, res) => {
  const list = await getFirestoreCampaigns();
  const found = list.some(c => c.id === req.params.id);
  if (found) {
    await deleteFirestoreCampaign(req.params.id);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Campaign not found." });
});


// 4. Gemini AI Integrated Growth Optimization
app.post("/api/gemini/growth-strategy", async (req, res) => {
  const { username, niche, contentFrequency, targetAudience, goal } = req.body;

  if (!username || !niche) {
    return res.status(400).json({ error: "Username and content niche are required." });
  }

  const cleanUsername = username.replace("@", "").trim();

  try {
    const client = getGeminiClient();
    
    const prompt = `
      You are an expert Instagram algorithm engineer and content marketing strategist for "Follow Plus", a high-tech premium organic Instagram growth firm.
      Generate a comprehensive, tailored, and action-oriented Instagram Growth Auditing & Content Strategy for the following profile inputs:
      - Username: @${cleanUsername}
      - Content Niche/Industry: ${niche}
      - Posting Frequency: ${contentFrequency || "Not specified"}
      - Target Audience Location & Interest: ${targetAudience || "Global interested in " + niche}
      - Primary Account Metric Goal: ${goal || "Increase Followers & Profile Reach"}

      Please generate your response in strict, clean JSON format matching this schema. Provide high-quality, fully populated real responses (no placeholds like 'Lorem Ipsum' or 'sample text').
      Do not wrap it in any markdown backticks except standard raw JSON if needed, or simply return JSON. Let the schema be:
      {
        "accountScore": number (out of 100, custom simulated estimation based on their niche competition),
        "competitorBenchmarks": {
          "averageEngagementRate": "string (e.g., '3.4%')",
          "topCompetitorTags": ["string", "string", "string"]
        },
        "criticalActionItems": [
          {
            "priority": "HIGH" | "MEDIUM" | "LOW",
            "title": "Short title",
            "description": "Specific action text with instructions.",
            "impactMetric": "Reach" | "Algorithm Match" | "Bio Optimize" | "Conversion"
          }
        ],
        "viralContentIdeas": [
          {
            "hook": "Specific viral hook line for Reels",
            "body": "Step-by-step video script outline.",
            "postType": "Reels" | "Carousel" | "Story Series",
            "suggestedAudioStyle": "Trending uptempo, Voiceover, educational ambient, etc."
          }
        ],
        "hashtagStrategy": ["string", "string", "string", "string", "string", "string", "string", "string", "string", "string"],
        "recommendedPostingSchedule": [
          {
            "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
            "bestTime": "string (e.g. '3:00 PM EST')",
            "reason": "String explaining audience activity"
          }
        ],
        "algorithmSecretHack": "A 2-sentence advanced trick to exploit current Reels algorithms for this niche."
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text || "";
    const parsedData = JSON.parse(jsonText.trim());
    res.json(parsedData);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Fallback template strategy in case API key is missing or encounters call limits
    // Providing an incredibly rich, interactive template that matches their inputs
    const score = Math.floor(Math.random() * 20) + 70;
    const fallbackResponse = {
      isFallback: true,
      accountScore: score,
      competitorBenchmarks: {
        averageEngagementRate: "4.2%",
        topCompetitorTags: [`#${niche.replace(/\s+/g, '')}Growth`, `#${niche.replace(/\s+/g, '')}Inspo`, `#${niche.replace(/\s+/g, '')}Trends`]
      },
      criticalActionItems: [
        {
          priority: "HIGH",
          title: "Bio Refresh & Opt-in Magnet",
          description: `Update the bio of @${cleanUsername} to lead with the core value proposal of your ${niche} niche. Use a clear single-line call to action.`,
          impactMetric: "Conversion"
        },
        {
          priority: "HIGH",
          title: "Optimize First 3 Seconds Loop Hook",
          description: "Reels algorithm counts 'loop score' heavily. Craft custom visual text cards in the first 3 seconds to keep users reading while your video loops in the background.",
          impactMetric: "Reach"
        },
        {
          priority: "MEDIUM",
          title: "Engagement Spikes Posting Method",
          description: "Initiate 10-15 comments with active profiles in similar niches 15 minutes BEFORE and 15 minutes AFTER your posts to signal live account activity.",
          impactMetric: "Algorithm Match"
        }
      ],
      viralContentIdeas: [
        {
          hook: `The absolute biggest lie people tell you about ${niche}...`,
          body: "Begin with a controversial split-screen clip. Deliver 3 bulletproof, fast counters and close by telling people to save the video for later reference.",
          postType: "Reels",
          suggestedAudioStyle: "Trending Synth-Pop instrumental with visual cuts on beat drops"
        },
        {
          hook: `How to 10x your progress in ${niche} within 30 days`,
          body: "A clean, high-contrast carousel post. Slide 1 is a bold challenge. Slide 2-4 outlines the calendar block. Slide 5 has a 'comment GROWTH' automation invite.",
          postType: "Carousel",
          suggestedAudioStyle: "Aesthetic low-fi ambient beats"
        }
      ],
      hashtagStrategy: [
        `#${niche.toLowerCase().replace(/\s+/g, '')}`,
        `#${niche.toLowerCase().replace(/\s+/g, '')}creator`,
        `#${niche.toLowerCase().replace(/\s+/g, '')}tips`,
        "#instagramgrowth",
        "#viralreels",
        "#contentstrategy",
        "#socialmediahacks",
        "#followplusboost",
        "#organicreach",
        "#algorithmupdate"
      ],
      recommendedPostingSchedule: [
        {
          day: "Tuesday",
          bestTime: "11:00 AM EST",
          reason: "Mid-week lunch peak provides maximum instantaneous retention for educational items."
        },
        {
          day: "Thursday",
          bestTime: "5:00 PM EST",
          reason: "Prior to weekend transitions, audiences consume content related to weekend optimization."
        },
        {
          day: "Sunday",
          bestTime: "8:00 PM EST",
          reason: "Late Sunday evenings present the highest weekly desktop and mobile couch-scrolling statistics."
        }
      ],
      algorithmSecretHack: `Save your posts! Create a 'Resources Library' aesthetic. When users bookmark your post to save it for later, Instagram attributes 10x higher weight to 'Saves' than to 'Likes', rocketing your Reel onto the Explorer feed.`
    };
    
    // Send fallback mock optimization with dynamic context so the applet is never broken!
    res.json(fallbackResponse);
  }
});

// Configure Vite integration for server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const docsPath = path.join(process.cwd(), 'docs');
    app.use(express.static(docsPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(docsPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Follow Plus Fullstack server is active on port ${PORT}`);
  });
}

startServer();
