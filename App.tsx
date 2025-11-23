
import React, { useState, useEffect } from 'react';
import { AppState, QuizQuestion, QuizResult, QuizMode, QuizSettings, UserProfile, QuizHistoryItem } from './types';
import { InputView } from './components/InputView';
import { QuizView } from './components/QuizView';
import { ResultView } from './components/ResultView';
import { ProfileDropdown } from './components/ProfileDropdown';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { AuthView } from './components/AuthView';
import { HistoryView } from './components/HistoryView';
import { generateQuizFromContent } from './services/geminiService';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile, saveQuizHistory, getQuizHistory } from './services/storageService';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  
  // Settings & Profile State
  const [activeSettings, setActiveSettings] = useState<QuizSettings | null>(null);
  const [activeMode, setActiveMode] = useState<QuizMode>('MIXED');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // History
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  // Initialize
  useEffect(() => {
    // Check Auth
    const currentUser = getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setAppState(AppState.INPUT);
    } else {
        setAppState(AppState.AUTH);
    }

    // Check Theme preference logic could go here if stored
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string) => {
    try {
        const u = loginUser(email, pass);
        setUser(u);
        setAppState(AppState.INPUT);
        setError(null);
    } catch (e: any) {
        setError(e.message);
    }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    try {
        const u = registerUser(name, email, pass);
        setUser(u);
        setAppState(AppState.INPUT);
        setError(null);
    } catch (e: any) {
        setError(e.message);
    }
  };

  const handleLogout = () => {
      logoutUser();
      setUser(null);
      setAppState(AppState.AUTH);
  };

  const handleUpdateUser = (updated: UserProfile) => {
      // Preserve ID and Email, update others
      if (!user) return;
      const finalUpdate = { ...user, ...updated };
      updateUserProfile(finalUpdate);
      setUser(finalUpdate);
  };

  const handleGenerate = async (text: string, files: File[], mode: QuizMode, count: number, settings: QuizSettings) => {
    setAppState(AppState.LOADING);
    setError(null);
    setActiveSettings(settings);
    setActiveMode(mode);
    
    // Determine a topic name for history
    let topic = "General Review";
    if (text.trim().length > 0) {
        topic = text.slice(0, 30).split('\n')[0] + (text.length > 30 ? '...' : '');
    } else if (files.length > 0) {
        topic = `File Study (${files.length} files)`;
    }
    setCurrentTopic(topic);

    try {
      const generatedQuestions = await generateQuizFromContent(text, files, mode, count, settings);
      setQuestions(generatedQuestions);
      setAppState(AppState.QUIZ);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate quiz. Please ensure your API key is valid and try again.");
      setAppState(AppState.INPUT);
    }
  };

  const handleQuizFinish = (result: QuizResult) => {
    setLastResult(result);
    
    // Save to History
    if (user && activeSettings) {
        const historyItem: QuizHistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            topic: currentTopic,
            score: result.score,
            totalQuestions: result.totalQuestions,
            timeTaken: result.timeTaken,
            mode: activeMode,
            difficulty: activeSettings.difficulty
        };
        saveQuizHistory(user.id, historyItem);
    }

    setAppState(AppState.RESULTS);
  };

  const handleRetry = () => {
    setAppState(AppState.QUIZ);
  };

  const handleNew = () => {
    setQuestions([]);
    setLastResult(null);
    setAppState(AppState.INPUT);
  };
  
  const handleOpenHistory = () => {
      if (user) {
          const data = getQuizHistory(user.id);
          setHistory(data);
          setAppState(AppState.HISTORY);
      }
  };

  const handleBackFromHistory = () => {
      setAppState(AppState.INPUT);
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Abstract Geometric Background */}
      <div className="fixed inset-0 z-0 opacity-60 dark:opacity-20 pointer-events-none transition-opacity duration-500">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#4285F4]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#EA4335]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-[#FBBC05]/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="bg-grid-pattern absolute inset-0 opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto h-screen flex flex-col md:h-auto md:min-h-screen md:py-8 lg:py-10 transition-all duration-300">
        
        {/* Header - Only show when logged in - Increased z-index to 100 for dropdown visibility */}
        {appState !== AppState.AUTH && user && (
            <div className="px-5 py-4 md:mb-2 flex items-center justify-between animate-in slide-up relative z-[100]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center text-[#4285F4] transition-colors group">
                    <BrainCircuit size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none transition-colors">Synapsy</h1>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Study Companion</span>
                </div>
            </div>
            
            <ProfileDropdown 
                user={user} 
                isDarkMode={darkMode} 
                toggleTheme={() => setDarkMode(!darkMode)}
                onOpenSettings={() => setIsProfileSettingsOpen(true)}
                onOpenHistory={handleOpenHistory}
                onLogout={handleLogout}
            />
            </div>
        )}

        {/* Card Container */}
        <div className={`flex-1 flex flex-col md:flex-none md:bg-white md:dark:bg-slate-800 md:rounded-[2.5rem] md:shadow-2xl md:shadow-slate-200/50 md:dark:shadow-black/40 md:border md:border-white/50 md:dark:border-slate-700 overflow-hidden relative min-h-[600px] mx-0 md:mx-4 lg:mx-auto lg:w-full transition-all duration-300 backdrop-blur-xl ${appState === AppState.AUTH ? 'bg-transparent shadow-none border-none md:bg-transparent md:shadow-none md:border-none' : ''}`}>
          
          {/* Profile Settings Modal */}
          {user && (
            <ProfileSettingsModal 
                isOpen={isProfileSettingsOpen}
                onClose={() => setIsProfileSettingsOpen(false)}
                user={user}
                onUpdateUser={handleUpdateUser}
            />
          )}

          {/* Loading State */}
          {appState === AppState.LOADING && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
               <div className="relative mb-8">
                  <div className="w-20 h-20 border-[6px] border-[#e5e7eb] dark:border-slate-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-[6px] border-[#4285F4] rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-[#FBBC05] animate-pulse" size={24} fill="currentColor" />
                  </div>
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Generating Quiz...</h3>
               <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs">Synapsy is analyzing your content to build a custom challenge.</p>
            </div>
          )}

          {/* Error State */}
          {error && appState !== AppState.AUTH && (
              <div className="absolute top-6 left-6 right-6 z-50 bg-[#EA4335] text-white px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-up shadow-lg shadow-red-200 dark:shadow-none">
                  <div className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse"></div>
                  <p className="text-sm font-bold flex-1">{error}</p>
                  <button onClick={() => setError(null)} className="font-bold opacity-60 hover:opacity-100 p-1">✕</button>
              </div>
          )}

          {appState === AppState.AUTH && (
             <AuthView onLogin={handleLogin} onRegister={handleRegister} error={error} />
          )}

          {(appState === AppState.INPUT || appState === AppState.LOADING) && user && (
            <InputView 
              onGenerate={handleGenerate} 
              isGenerating={appState === AppState.LOADING} 
              userName={user.name.split(' ')[0]} // Pass first name only
            />
          )}

          {appState === AppState.QUIZ && (
            <QuizView 
              questions={questions} 
              onFinish={handleQuizFinish} 
              onExit={handleNew}
              timeLimit={activeSettings?.timeLimit}
            />
          )}

          {appState === AppState.RESULTS && lastResult && (
            <ResultView 
              result={lastResult} 
              onRetry={handleRetry} 
              onNew={handleNew} 
            />
          )}

          {appState === AppState.HISTORY && (
              <HistoryView history={history} onBack={handleBackFromHistory} />
          )}
        </div>

        {/* Footer for desktop */}
        <div className="hidden md:block text-center mt-6 animate-in fade-in delay-200">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Powered by Gemini 2.5 • Synapsy</p>
        </div>

      </div>
    </div>
  );
}
