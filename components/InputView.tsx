
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { X, Sparkles, Shuffle, ListChecks, CheckSquare, Type, Dice5, FileText, SlidersHorizontal, BrainCircuit, Paperclip, GalleryVerticalEnd, MinusSquare, FileText as FileIcon, Sword, Flame, Clock } from 'lucide-react';
import { QuizMode, QuizSettings, QuestionType, UserProfile, AIPersonality } from '../types';
import { SettingsModal } from './SettingsModal';

interface InputViewProps {
  onGenerate: (text: string, files: File[], mode: QuizMode, count: number, settings: QuizSettings) => void;
  onSummarize: (text: string, files: File[]) => void;
  isGenerating: boolean;
  user?: UserProfile | null;
}

export const InputView: React.FC<InputViewProps> = ({ onGenerate, onSummarize, isGenerating, user }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [quizMode, setQuizMode] = useState<QuizMode>('MIXED');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'MEDIUM',
    timeLimit: 0,
    allowedTypes: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.MATCHING, QuestionType.ORDERING, QuestionType.FILL_IN_THE_BLANK, QuestionType.FLASHCARD],
    personality: user?.stats?.unlockedPersonas.includes(AIPersonality.COACH) ? AIPersonality.PROFESSOR : AIPersonality.PROFESSOR, // Default
    enableExplainItBack: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = () => {
    if (!text.trim() && files.length === 0) return;
    onGenerate(text, files, quizMode, questionCount, settings);
  };
  
  const handleSummarizeAction = () => {
    if (!text.trim() && files.length === 0) return;
    onSummarize(text, files);
  };

  const handleSurpriseMe = () => {
    const topics = [
      "The intelligence of Octopuses 🐙",
      "History of Coffee ☕️",
      "Quantum Physics for Cats 🐈",
      "The psychology of dreams 💭",
      "The Ninja Code of Honor ⚔️",
      "How Black Holes work 🕳️"
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setText(`Generate a quiz about: ${randomTopic}`);
  };

  const quizModes: { id: QuizMode; label: string; sub: string; icon: React.ReactNode; color: string; bg: string; }[] = [
    { id: 'MIXED', label: 'Mixed', sub: 'Variety', icon: <Shuffle size={16} />, color: 'text-[#FBBC05]', bg: 'bg-[#FBBC05]' },
    { id: 'BOSS_BATTLE', label: 'Boss Battle', sub: 'RPG Mode', icon: <Sword size={16} />, color: 'text-red-500', bg: 'bg-red-500' },
    { id: 'FLASHCARD', label: 'Flashcards', sub: 'Flip', icon: <GalleryVerticalEnd size={16} />, color: 'text-pink-500', bg: 'bg-pink-500' },
    { id: 'CONCEPTUAL', label: 'Deep Work', sub: 'Logic', icon: <BrainCircuit size={16} />, color: 'text-purple-500', bg: 'bg-purple-500' },
    { id: 'FILL_IN_THE_BLANK', label: 'Blanks', sub: 'Recall', icon: <MinusSquare size={16} />, color: 'text-cyan-500', bg: 'bg-cyan-500' },
    { id: 'MULTIPLE_CHOICE', label: 'Choices', sub: 'Classic', icon: <ListChecks size={16} />, color: 'text-[#4285F4]', bg: 'bg-[#4285F4]' },
    { id: 'TRUE_FALSE', label: 'True/False', sub: 'Quick', icon: <CheckSquare size={16} />, color: 'text-[#34A853]', bg: 'bg-[#34A853]' },
  ];

  return (
    <div className="flex flex-col h-full relative animate-in fade-in transition-colors duration-300">
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
        quizMode={quizMode}
        user={user}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6">
        
        {/* Header Section with Gamification Stats */}
        <div className="flex gap-3 mb-5">
             {/* Welcome Banner */}
             <div 
                onClick={handleSurpriseMe}
                className="flex-1 group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 md:p-4 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
            >
                <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base md:text-lg font-bold mb-0.5 leading-tight">Hi, {user?.name.split(' ')[0]}! 👋</h2>
                        <p className="text-indigo-100 text-[10px] md:text-xs font-medium">Tap for a random topic.</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors shrink-0">
                        <Dice5 size={18} className="text-white group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                </div>
                <div className="absolute -right-4 -bottom-10 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            </div>

            {/* Gamification Mini-Card */}
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
                 <div className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 mb-1">
                     <Flame size={14} className="fill-current animate-pulse-slow" />
                     <span className="text-xs font-black">{user?.stats?.streakDays || 0} Day</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">
                     <Clock size={10} />
                     <span>{user?.stats?.totalMinutesStudied || 0} mins</span>
                 </div>
            </div>
        </div>

        {/* Compact Source Input */}
        <section className="mb-5">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Material</span>
                {files.length > 0 && <span className="text-[10px] font-bold text-[#34A853] bg-[#34A853]/10 px-2 py-0.5 rounded text-xs animate-in scale-in">{files.length} attached</span>}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#4285F4]/50 focus-within:border-[#4285F4] transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md group">
                <textarea
                    className="w-full h-24 md:h-28 p-3 bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none outline-none text-sm font-medium rounded-xl leading-relaxed"
                    placeholder="Paste notes, topics, or text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isGenerating}
                />
                
                {files.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto px-3 pb-3 pt-1 no-scrollbar">
                        {files.map((file, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden shadow-sm group animate-in scale-in bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {file.type === 'application/pdf' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
                                    <FileIcon size={16} className="text-red-500 dark:text-red-400" />
                                </div>
                            ) : (
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            )}
                            <button
                            onClick={() => removeFile(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                            <X size={12} className="text-white" />
                            </button>
                        </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center px-2 py-1.5 border-t border-slate-200/50 dark:border-slate-700">
                    <div className="flex items-center gap-2 pl-1">
                        <Type size={14} className={text ? "text-[#4285F4]" : "text-slate-300 dark:text-slate-600"} />
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-600">{text.length} chars</span>
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleFileUpload}
                        />
                        <button 
                            onClick={triggerFileInput}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <Paperclip size={12} />
                            <span>Add File</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        {/* Compact Quiz Mode Selector */}
        <section className="mb-5">
             <div className="flex items-center justify-between mb-2 px-1">
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quiz Mode</span>
               <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors uppercase tracking-wider"
               >
                   <SlidersHorizontal size={10} />
                   <span>Config</span>
               </button>
             </div>

             <div className="flex overflow-x-auto pb-2 gap-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-7 md:overflow-visible md:pb-0 no-scrollbar snap-x snap-mandatory">
                {quizModes.map((mode) => {
                    const isActive = quizMode === mode.id;
                    const isBoss = mode.id === 'BOSS_BATTLE';
                    return (
                        <button
                            key={mode.id}
                            onClick={() => setQuizMode(mode.id)}
                            className={`snap-center flex-shrink-0 min-w-[90px] md:min-w-0 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 relative group overflow-hidden
                            ${isActive 
                                ? (isBoss ? 'bg-red-500 text-white border-red-600 shadow-red-200' : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-md shadow-indigo-100 dark:shadow-none scale-100 ring-1 ring-indigo-500/20')
                                : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {isBoss && isActive && <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-orange-500 opacity-50 z-0"></div>}
                            
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-transform duration-300 relative z-10 ${isActive ? 'scale-110 shadow-sm' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'} ${isBoss && isActive ? 'bg-white/20 text-white' : `${mode.bg}/10 ${mode.color}`}`}>
                                {mode.icon}
                            </div>
                            <div className={`text-xs font-bold mb-0 relative z-10 ${isActive ? (isBoss ? 'text-white' : 'text-slate-800 dark:text-slate-100') : 'text-slate-500 dark:text-slate-500'}`}>
                                {mode.label}
                            </div>
                            <div className={`text-[9px] font-semibold relative z-10 ${isActive ? (isBoss ? 'text-red-100' : 'text-slate-400 dark:text-slate-600') : 'text-slate-400 dark:text-slate-600'}`}>
                                {mode.sub}
                            </div>
                        </button>
                    );
                })}
             </div>

             {/* Compact Slider */}
             <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors mt-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Question Count</span>
                    <span className="text-sm font-black text-[#4285F4]">{questionCount}</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4285F4] hover:accent-[#3367d6] transition-all"
                />
             </div>
        </section>

        {/* Compact Action Buttons */}
        <section className="pb-4 flex gap-3">
             <Button 
                fullWidth 
                size="md" 
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={!text.trim() && files.length === 0}
                className={`flex-2 bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20 py-3 text-base font-bold rounded-xl transition-all active:scale-[0.98] ${isGenerating ? 'animate-pulse' : ''}`}
                icon={quizMode === 'BOSS_BATTLE' ? <Sword size={16} /> : <Sparkles size={16} className="text-blue-100" />}
            >
                {isGenerating ? 'Analyzing...' : (quizMode === 'BOSS_BATTLE' ? 'Fight Boss' : 'Generate Quiz')}
            </Button>
            
            <Button 
                size="md" 
                onClick={handleSummarizeAction}
                isLoading={isGenerating}
                disabled={!text.trim() && files.length === 0}
                className={`flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 shadow-sm py-3 text-sm font-bold rounded-xl transition-all active:scale-[0.98]`}
                icon={<FileText size={16} />}
            >
                Summarize
            </Button>
        </section>

      </div>
    </div>
  );
};
