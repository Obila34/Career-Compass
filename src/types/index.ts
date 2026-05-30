import { Timestamp } from "firebase/firestore";

export interface ExperienceItem {
  title: string;
  company: string;
  startYear: number | null;
  endYear: number | null;
  isCurrent: boolean;
  description?: string;
}

export interface EducationItem {
  institution: string;
  degree: string | null;
  graduationYear: number | null;
}

export interface User {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  headline: string;                    // "Senior Product Manager | Fintech"
  bio: string;
  currentRole: string;
  currentCompany: string;
  currentCity: string;
  currentCountry: string;
  originCity: string;
  diasporaHub: string;
  startupName?: string;
  startupStage?: string;
  sector?: string;
  accelerators?: string[];
  skills: string[];
  industries: string[];
  seniority: "entry"|"mid"|"senior"|"lead"|"executive";
  yearsOfExperience: number;
  salaryExpectationUSD: number;
  openToRoles: boolean;
  lookingFor: string[];
  locationPreferences: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  languages: string[];
  linkedinUrl: string;
  cvUrl: string;                       // Firebase Storage URL
  profileEmbedding?: number[];          // 768-dim for job matching
  isVerified: boolean;
  profileCompleteness: number;         // 0-100 score
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Job {
  id?: string;
  title: string;
  company: string;
  companyWebsite: string;
  companyLogoUrl?: string;
  location: string;
  locationType: "remote"|"hybrid"|"onsite";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  description: string;
  requirements: string[];
  applyUrl: string;
  source: "lever"|"greenhouse"|"ashby"|"remotive"|"manual"|string;
  scrapedAt: Timestamp;
  postedAt: Timestamp;
  expiresAt?: Timestamp;
  legitimacyScore: number;
  legitimacyFlags: string[];
  legitimacyVerdict: "approve"|"review"|"reject";
  legitimacyReasoning: string;
  vetStatus: "pending"|"approved"|"rejected";
  vetReviewedBy?: string | null;
  vetReviewedAt?: Timestamp | null;
  jobEmbedding?: number[];
  networkInsiders: string[];           // userIds who work at this company
  applicationCount?: number;
  isActive?: boolean;
}

export interface Review {
  id?: string;
  jobId: string;
  reviewerId: string;
  decision: "approve" | "reject";
  note: string;
  createdAt: Timestamp;
}

