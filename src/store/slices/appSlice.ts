import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Candidate, InterviewSession, Question, ChatMessage } from '../../types';

const initialState: AppState = {
  candidates: [],
  currentCandidateId: undefined,
  activeTab: 'interviewee',
  showWelcomeBackModal: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Omit<Candidate, 'id' | 'createdAt' | 'completedSessions' | 'profileComplete'>>) => {
      const newCandidate: Candidate = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date(),
        completedSessions: [],
        profileComplete: !!(action.payload.name && action.payload.email && action.payload.phone),
      };
      state.candidates.push(newCandidate);
    },
    
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id);
      if (candidate) {
        Object.assign(candidate, action.payload.updates);
        candidate.profileComplete = !!(candidate.name && candidate.email && candidate.phone);
      }
    },
    
    setCurrentCandidate: (state, action: PayloadAction<string | undefined>) => {
      state.currentCandidateId = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    
    startInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate && candidate.profileComplete) {
        const questions: Question[] = [
          {
            id: uuidv4(),
            text: "What is React and how does it differ from other JavaScript frameworks?",
            difficulty: 'easy',
            timeLimit: 20,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            text: "Explain the concept of state in React and how it's managed.",
            difficulty: 'easy',
            timeLimit: 20,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            text: "How would you implement authentication in a Node.js application?",
            difficulty: 'medium',
            timeLimit: 60,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            text: "Describe the process of connecting a React frontend to a Node.js backend API.",
            difficulty: 'medium',
            timeLimit: 60,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            text: "Design a scalable database architecture for a real-time chat application.",
            difficulty: 'hard',
            timeLimit: 120,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            text: "How would you optimize a React application for performance and handle large datasets?",
            difficulty: 'hard',
            timeLimit: 120,
            timestamp: new Date(),
          },
        ];
        
        const session: InterviewSession = {
          id: uuidv4(),
          candidateId,
          startTime: new Date(),
          status: 'in-progress',
          currentQuestionIndex: 0,
          questions,
        };
        
        candidate.currentSession = session;
        
        // Check if there's an incomplete session
        const hasIncompleteSession = state.candidates.some(c => 
          c.currentSession && c.currentSession.status === 'in-progress'
        );
        
        if (hasIncompleteSession && candidateId !== state.currentCandidateId) {
          state.showWelcomeBackModal = true;
        }
      }
    },
    
    submitAnswer: (state, action: PayloadAction<{ candidateId: string; questionId: string; answer: string }>) => {
      const { candidateId, questionId, answer } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate?.currentSession) {
        const question = candidate.currentSession.questions.find(q => q.id === questionId);
        if (question) {
          question.answer = answer;
          // Simulate AI scoring (in real app, this would call an AI API)
          const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
          question.score = score;
          question.feedback = score > 80 ? 'Excellent answer!' : score > 70 ? 'Good answer' : 'Needs improvement';
        }
      }
    },
    
    moveToNextQuestion: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate?.currentSession) {
        candidate.currentSession.currentQuestionIndex += 1;
        
        if (candidate.currentSession.currentQuestionIndex >= candidate.currentSession.questions.length) {
          // Interview completed
          candidate.currentSession.status = 'completed';
          candidate.currentSession.endTime = new Date();
          
          // Calculate total score
          const totalScore = candidate.currentSession.questions.reduce((sum, q) => sum + (q.score || 0), 0);
          candidate.currentSession.totalScore = totalScore / candidate.currentSession.questions.length;
          
          // Generate AI summary
          candidate.currentSession.aiSummary = `Candidate demonstrated ${candidate.currentSession.totalScore > 80 ? 'strong' : candidate.currentSession.totalScore > 70 ? 'good' : 'basic'} technical knowledge. ${candidate.currentSession.totalScore > 80 ? 'Recommended for next round.' : 'Consider for junior role or additional training.'}`;
          
          // Move to completed sessions
          candidate.completedSessions.push(candidate.currentSession);
          candidate.currentSession = undefined;
        }
      }
    },
    
    pauseInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate?.currentSession) {
        candidate.currentSession.status = 'paused';
      }
    },
    
    resumeInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate?.currentSession) {
        candidate.currentSession.status = 'in-progress';
      }
    },
    
    setWelcomeBackModal: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBackModal = action.payload;
    },
    
    resetInterview: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      
      if (candidate) {
        candidate.currentSession = undefined;
      }
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  setActiveTab,
  startInterview,
  submitAnswer,
  moveToNextQuestion,
  pauseInterview,
  resumeInterview,
  setWelcomeBackModal,
  resetInterview,
} = appSlice.actions;

export default appSlice.reducer;
