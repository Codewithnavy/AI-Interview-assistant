export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume?: File;
  resumeText?: string;
  currentSession?: InterviewSession;
  completedSessions: InterviewSession[];
  profileComplete: boolean;
  createdAt: Date;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  currentQuestionIndex: number;
  questions: Question[];
  totalScore?: number;
  aiSummary?: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
  answer?: string;
  score?: number;
  feedback?: string;
  timestamp: Date;
}

export interface AppState {
  candidates: Candidate[];
  currentCandidateId?: string;
  activeTab: 'interviewee' | 'interviewer' | 'analytics';
  showWelcomeBackModal: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'ai';
  content: string;
  timestamp: Date;
  questionId?: string;
}
