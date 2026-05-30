import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  headline: string;
  bio: string;
  startupName: string;
  startupStage: "idea" | "pre-seed" | "seed" | "series-a" | "growth" | string;
  sector: string[];
  originCity: string;
  currentCity: string;
  currentCountry: string;
  diasporaHub: "usa" | "uk" | "canada" | "uae" | "kenya" | "other" | string;
  accelerators: string[];
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  lookingFor: Array<"investor" | "cofounder" | "customer" | "advisor" | "talent" | string>;
  isVerified: boolean;
  profileEmbedding: number[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Connection {
  id?: string;
  userA: string;
  userB: string;
  strength: number;
  sharedContext: string[];
  status: "pending" | "connected" | "declined";
  initiatedBy: string;
  createdAt: Timestamp;
}

export interface IntroRequest {
  id?: string;
  requesterId: string;
  targetId: string;
  connectorsPath: string[];
  pathStrength: number;
  aiExplanation: string;
  draftMessage: string;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: Timestamp;
}

export interface Job {
  id?: string;
  title: string;
  company: string;
  companyWebsite: string;
  location: string;
  locationType: "remote" | "hybrid" | "onsite";
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  description: string;
  applyUrl: string;
  source: string;
  scrapedAt: Timestamp;
  postedAt: Timestamp;
  legitimacyScore: number;
  legitimacyFlags: string[];
  vetStatus: "pending" | "approved" | "rejected";
  vetReviewedBy?: string;
  vetReviewedAt?: Timestamp;
  jobEmbedding?: number[];
  warmPathUsers: string[];
}

export interface Review {
  id?: string;
  jobId: string;
  reviewerId: string;
  decision: "approve" | "reject";
  note: string;
  createdAt: Timestamp;
}
