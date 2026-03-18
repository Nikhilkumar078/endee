export type InterviewMode = 'Technical' | 'HR' | 'Rapid Fire' | 'Company-specific';

export interface Question {
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
  timestamp?: string;
}

export interface Evaluation {
  communication: number;
  technical: number;
  confidence: number;
  hireability: number;
  summary: string;
  strongAreas: string[];
  weakAreas: string[];
  suggestions: string[];
}

export interface Interview {
  id?: string;
  userId: string;
  mode: InterviewMode;
  company?: string;
  status: 'ongoing' | 'completed';
  questions: Question[];
  overallScore?: number;
  evaluation?: Evaluation;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  skills: string[];
  targetCompany?: string;
  avgScore: number;
  totalInterviews: number;
  createdAt: string;
}

export interface Weakness {
  id?: string;
  userId: string;
  topic: string;
  frequency: number;
  lastEncountered: string;
}

export interface PrepPlan {
  id?: string;
  userId: string;
  target: string;
  durationDays: number;
  plan: {
    day: number;
    topics: string[];
    tasks: string[];
  }[];
  createdAt: string;
}
