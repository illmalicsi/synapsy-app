
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ORDERING = 'ORDERING',
  MATCHING = 'MATCHING',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  FLASHCARD = 'FLASHCARD'
}

export type QuizMode = 'MIXED' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CONCEPTUAL' | 'FLASHCARD' | 'FILL_IN_THE_BLANK' | 'BOSS_BATTLE';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export enum AIPersonality {
  PROFESSOR = 'PROFESSOR', // Standard, academic
  COACH = 'COACH',         // High energy, tough love
  BUDDY = 'BUDDY',         // Casual, slang, friendly
  SOCRATIC = 'SOCRATIC'    // Asks questions back (used in hints/explanations)
}

export interface QuizSettings {
  difficulty: Difficulty;
  timeLimit: number; // seconds per question, 0 for off
  allowedTypes: QuestionType[]; // for filtering mixed mode
  personality: AIPersonality;
  enableExplainItBack: boolean; // New feature
}

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options: string[]; // For MC and T/F
  correctAnswer: string;
  explanation: string;
  hint: string;             // New: Subtle clue
  simpleExplanation: string; // New: ELI5 analogy
  
  // New Fields for Advanced Types
  orderingItems?: string[]; // The items in the correct order
  matchingPairs?: { left: string; right: string }[]; // Pairs to match
  
  // New Field for Media Integration
  searchQuery?: string; // A query string to find relevant videos/resources
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number; // in seconds
  xpEarned: number; // New gamification
}

export interface UserStats {
  totalMinutesStudied: number;
  quizzesCompleted: number;
  totalXp: number;
  streakDays: number;
  lastStudyDate: number; // timestamp
  unlockedPersonas: AIPersonality[];
}

export interface UserProfile {
  id: string; // Unique ID (e.g., email)
  name: string;
  email: string;
  avatarSeed: string;
  stats?: UserStats; // Optional for backward compatibility
}

export interface QuizHistoryItem {
  id: string;
  timestamp: number;
  topic: string; // Short summary of what was studied
  score: number;
  totalQuestions: number;
  mode: QuizMode;
  difficulty: Difficulty;
  timeTaken: number;
}

export enum AppState {
  AUTH = 'AUTH',
  INPUT = 'INPUT',
  LOADING = 'LOADING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  HISTORY = 'HISTORY',
  SUMMARY = 'SUMMARY'
}
