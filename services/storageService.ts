
import { UserProfile, QuizHistoryItem, UserStats, AIPersonality } from '../types';

const USERS_KEY = 'gdg_app_users';
const CURRENT_USER_KEY = 'gdg_app_current_user';
const HISTORY_PREFIX = 'gdg_app_history_';

// Initial Stats
const initialStats: UserStats = {
  totalMinutesStudied: 0,
  quizzesCompleted: 0,
  totalXp: 0,
  streakDays: 0,
  lastStudyDate: 0,
  unlockedPersonas: [AIPersonality.PROFESSOR] // Default unlock
};

// Mock Auth
export const registerUser = (name: string, email: string, password: string): UserProfile => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: any[] = usersStr ? JSON.parse(usersStr) : [];

  if (users.find((u: any) => u.email === email)) {
    throw new Error('User already exists');
  }

  const newUser: UserProfile = {
    id: email,
    name,
    email,
    avatarSeed: name + Math.random().toString(36).substring(7),
    stats: { ...initialStats }
  };

  // In a real app, hash the password. Here we store the object + password (mock).
  const userRecord = { ...newUser, password };
  users.push(userRecord);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Auto login
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const loginUser = (email: string, password: string): UserProfile => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: any[] = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find((u: any) => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarSeed: user.avatarSeed,
    stats: user.stats || { ...initialStats } // Backfill if missing
  };
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  return profile;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const updateUserProfile = (user: UserProfile) => {
  // Update current session
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  // Update in DB
  const usersStr = localStorage.getItem(USERS_KEY);
  if (usersStr) {
    let users = JSON.parse(usersStr);
    users = users.map((u: any) => u.id === user.id ? { ...u, ...user } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

// History
export const saveQuizHistory = (userId: string, item: QuizHistoryItem) => {
  const key = HISTORY_PREFIX + userId;
  const historyStr = localStorage.getItem(key);
  const history: QuizHistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
  
  // Add to beginning
  history.unshift(item);
  
  localStorage.setItem(key, JSON.stringify(history));
};

export const getQuizHistory = (userId: string): QuizHistoryItem[] => {
  const key = HISTORY_PREFIX + userId;
  const historyStr = localStorage.getItem(key);
  return historyStr ? JSON.parse(historyStr) : [];
};

// Stats Logic
export const updateUserStats = (user: UserProfile, minutesToAdd: number, xpToAdd: number): UserProfile => {
    const currentStats = user.stats || { ...initialStats };
    const now = Date.now();
    
    // Streak Logic
    let newStreak = currentStats.streakDays;
    if (currentStats.lastStudyDate === 0) {
        newStreak = 1;
    } else {
        const lastDate = new Date(currentStats.lastStudyDate);
        const currentDate = new Date(now);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // If studied yesterday, increment. If today, same. If missed a day, reset.
        // Simplified check:
        const isSameDay = lastDate.getDate() === currentDate.getDate() && lastDate.getMonth() === currentDate.getMonth();
        if (!isSameDay) {
            if (diffDays <= 2) { // Allow ~48h window to keep streak
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        }
    }

    // Persona Unlocks
    const newUnlocked = [...currentStats.unlockedPersonas];
    const totalMins = currentStats.totalMinutesStudied + minutesToAdd;
    
    if (totalMins >= 10 && !newUnlocked.includes(AIPersonality.COACH)) {
        newUnlocked.push(AIPersonality.COACH);
    }
    if (totalMins >= 30 && !newUnlocked.includes(AIPersonality.BUDDY)) {
        newUnlocked.push(AIPersonality.BUDDY);
    }
    if (totalMins >= 60 && !newUnlocked.includes(AIPersonality.SOCRATIC)) {
        newUnlocked.push(AIPersonality.SOCRATIC);
    }

    const newStats: UserStats = {
        totalMinutesStudied: totalMins,
        quizzesCompleted: currentStats.quizzesCompleted + 1,
        totalXp: currentStats.totalXp + xpToAdd,
        streakDays: newStreak,
        lastStudyDate: now,
        unlockedPersonas: newUnlocked
    };

    const updatedUser = { ...user, stats: newStats };
    updateUserProfile(updatedUser);
    return updatedUser;
};
