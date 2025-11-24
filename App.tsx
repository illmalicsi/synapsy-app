
import React, { useState, useEffect } from 'react';
import { AppState, QuizQuestion, QuizResult, QuizMode, QuizSettings, UserProfile, QuizHistoryItem } from './types';
import { InputView } from './components/InputView';
import { QuizView } from './components/QuizView';
import { ResultView } from './components/ResultView';
import { ProfileDropdown } from './components/ProfileDropdown';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { AuthView } from './components/AuthView';
import { HistoryView } from './components/HistoryView';
import { SummaryView } from './components/SummaryView';
import { generateQuizFromContent, generateSummary } from './services/geminiService';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile, saveQuizHistory, getQuizHistory, updateUserStats } from './services/storageService';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  
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
      setError("Failed to generate quiz. Please check your connection.");
      setAppState(AppState.INPUT);
    }
  };

  const handleSummarize = async (text: string, files: File[]) => {
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const summary = await generateSummary(text, files);
      setSummaryText(summary);
      setAppState(AppState.SUMMARY);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate summary. Please check your connection.");
      setAppState(AppState.INPUT);
    }
  };

  const handleQuizFinish = (result: QuizResult) => {
    setLastResult(result);
    
    if (user && activeSettings) {
        // Save to History
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

        // Update Stats & Gamification
        const minutes = Math.ceil(result.timeTaken / 60);
        const xp = result.xpEarned || (result.score * 10);
        const updatedUser = updateUserStats(user, minutes, xp);
        setUser(updatedUser);
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
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#4285F4]/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#EA4335]/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="bg-grid-pattern absolute inset-0 opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto h-screen flex flex-col md:h-auto md:min-h-screen md:py-4 transition-all duration-300">
        
        {/* Header - Only show when logged in */}
        {appState !== AppState.AUTH && user && (
            <div className="px-4 py-3 md:mb-1 flex items-center justify-between animate-in slide-up relative z-[100]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center text-[#4285F4] transition-colors group">
                    <BrainCircuit size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none transition-colors">Synapsy</h1>
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

        {/* Card Container - More compact rounded corners and shadows */}
        <div className={`flex-1 flex flex-col md:flex-none md:bg-white md:dark:bg-slate-800 md:rounded-[1.5rem] md:shadow-xl md:shadow-slate-200/50 md:dark:shadow-black/40 md:border md:border-white/50 md:dark:border-slate-700 overflow-hidden relative min-h-[500px] mx-0 md:mx-4 lg:mx-auto lg:w-full transition-all duration-300 backdrop-blur-xl ${appState === AppState.AUTH ? 'bg-transparent shadow-none border-none md:bg-transparent md:shadow-none md:border-none' : ''}`}>
          
          {/* Profile Settings Modal */}
          {user && (
            <ProfileSettingsModal 
                isOpen={isProfileSettingsOpen}
                onClose={() => setIsProfileSettingsOpen(false)}
                user={user}
                onUpdateUser={handleUpdateUser}
            />
          )}

          {/* Loading State - COMPACT CUTE VERSION */}
          {appState === AppState.LOADING && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
               
               <div className="relative mb-6 group cursor-default">
                  {/* Cute Bouncing Character */}
                  <div className="relative z-10 animate-bounce duration-[2000ms]">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#4285F4] to-[#8AB4F8] rounded-[1.5rem] shadow-xl shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0 border-4 border-white dark:border-slate-800 relative overflow-hidden">
                        
                        {/* Shine effect */}
                        <div className="absolute top-0 right-0 w-10 h-10 bg-white/10 rounded-full blur-lg transform translate-x-2 -translate-y-2"></div>

                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <BrainCircuit size={32} className="text-white mb-0.5" strokeWidth={2.5} />
                            {/* Cute Face */}
                            <div className="flex gap-1.5 mt-0.5">
                                <div className="w-1.5 h-2 bg-white rounded-full animate-pulse"></div>
                                <div className="w-1.5 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                            </div>
                            <div className="w-3 h-1 bg-white/40 rounded-full mt-1"></div>
                        </div>
                      </div>
                  </div>
                  
                  {/* Shadow pulse */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-200 dark:bg-black/40 rounded-[100%] blur-sm animate-pulse"></div>

                  {/* Floating decorations */}
                  <div className="absolute -top-4 -right-4 animate-bounce delay-100">
                      <Sparkles className="text-[#FBBC05] drop-shadow-sm" size={20} fill="#FBBC05" />
                  </div>
                  <div className="absolute top-2 -left-4 animate-pulse delay-300">
                      <div className="text-xl rotate-[-15deg]">✨</div>
                  </div>
                   <div className="absolute bottom-2 -right-6 animate-bounce delay-700">
                       <div className="text-lg rotate-[15deg] opacity-80">💭</div>
                  </div>
               </div>

               <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 tracking-tight">Cooking up...</h3>
               
               <div className="flex items-center gap-1.5 justify-center mb-2">
                   <div className="w-2 h-2 bg-[#4285F4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-[#34A853] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-[#FBBC05] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   <div className="w-2 h-2 bg-[#EA4335] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
               </div>
               
               <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                   Preparing your study set
               </p>
            </div>
          )}

          {/* Error State */}
          {error && appState !== AppState.AUTH && (
              <div className="absolute top-4 left-4 right-4 z-50 bg-[#EA4335] text-white px-3 py-2.5 rounded-xl flex items-center gap-3 animate-in slide-up shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse"></div>
                  <p className="text-xs font-bold flex-1">{error}</p>
                  <button onClick={() => setError(null)} className="font-bold opacity-60 hover:opacity-100 p-1">✕</button>
              </div>
          )}

          {appState === AppState.AUTH && (
             <AuthView onLogin={handleLogin} onRegister={handleRegister} error={error} />
          )}

          {(appState === AppState.INPUT || appState === AppState.LOADING) && user && (
            <InputView 
              onGenerate={handleGenerate} 
              onSummarize={handleSummarize}
              isGenerating={appState === AppState.LOADING} 
              user={user}
            />
          )}

          {appState === AppState.QUIZ && (
            <QuizView 
              questions={questions} 
              onFinish={handleQuizFinish} 
              onExit={handleNew}
              timeLimit={activeSettings?.timeLimit}
              mode={activeMode}
              settings={activeSettings || undefined}
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
          
          {appState === AppState.SUMMARY && (
              <SummaryView summary={summaryText} onBack={handleNew} />
          )}
        </div>

        {/* Footer for desktop */}
        <div className="hidden md:block text-center mt-4 animate-in fade-in delay-200">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Powered by Gemini • Synapsy</p>
        </div>

      </div>
    </div>
  );
}
