import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Campaign } from "./types";

// Firebase App configuration directly connected to Google Firestore
const firebaseConfig = {
  projectId: "midyear-tree-1sjh2",
  appId: "1:843245185275:web:6194b3425eff631e3a285e",
  apiKey: "AIzaSyBaoOKYbDYrFk_tpooCJTkUMv0kJBFoBXc",
  authDomain: "midyear-tree-1sjh2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-25466f4a-55f2-4c8a-a96b-705f74b60567",
  storageBucket: "midyear-tree-1sjh2.firebasestorage.app",
  messagingSenderId: "843245185275"
};

let app;
let db: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log("Client-side Firebase Firestore initialized secure database with ID:", firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.error("Firebase client initialization error:", err);
}

export { db };

// Helper to simulate progressive delivery calculations on client side for static environments
export function simulateCampaignProgress(c: Campaign): Campaign {
  if (c.status === 'completed') return c;
  
  const now = Date.now();
  const elapsedSeconds = (now - c.createdAt) / 1000;
  
  if (c.type === 'free_followers_trial') {
    const deliveryRatePerSecond = 0.5; // 1 follower every 2 seconds
    const simulatedDelivered = Math.min(c.targetAmount, Math.floor(elapsedSeconds * deliveryRatePerSecond));
    const isDone = simulatedDelivered >= c.targetAmount;
    return {
      ...c,
      deliveredAmount: simulatedDelivered,
      status: isDone ? 'completed' : 'active'
    };
  } else {
    // Paid premium services: completes in roughly 5 minutes
    const deliveryRatePerSecond = c.targetAmount / 300;
    const simulatedDelivered = Math.min(c.targetAmount, Math.floor(elapsedSeconds * deliveryRatePerSecond));
    const isDone = simulatedDelivered >= c.targetAmount;
    return {
      ...c,
      deliveredAmount: simulatedDelivered,
      status: isDone ? 'completed' : 'active'
    };
  }
}

// 1. Fetch campaigns directly from Firestore
export async function getClientCampaignsDirectly(): Promise<Campaign[]> {
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  const snap = await getDocs(collection(db, "campaigns"));
  const list: Campaign[] = [];
  snap.forEach((d) => {
    const data = d.data();
    list.push(data as Campaign);
  });
  // Sort descending by creation date
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

// 2. Add campaign directly to Firestore
export async function addClientCampaignDirectly(c: Campaign): Promise<void> {
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  await setDoc(doc(db, "campaigns", c.id), c);
}

// 3. Delete campaign directly from Firestore
export async function deleteClientCampaignDirectly(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  await deleteDoc(doc(db, "campaigns", id));
}
