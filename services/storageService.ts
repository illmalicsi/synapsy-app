
import { UserProfile, QuizHistoryItem } from '../types';

const USERS_KEY = 'gdg_app_users';
const CURRENT_USER_KEY = 'gdg_app_current_user';
const HISTORY_PREFIX = 'gdg_app_history_';

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
    avatarSeed: name + Math.random().toString(36).substring(7)
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
    avatarSeed: user.avatarSeed
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
