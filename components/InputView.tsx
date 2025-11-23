
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Camera, X, Sparkles, Shuffle, ListChecks, CheckSquare, Type, Dice5, FileText, Image as ImageIcon, Settings as SettingsIcon, SlidersHorizontal, BrainCircuit, ScanSearch, CheckCircle2, Paperclip, FileType, GalleryVerticalEnd, MinusSquare } from 'lucide-react';
import { QuizMode, QuizSettings, QuestionType } from '../types';
import { SettingsModal } from './SettingsModal';

interface InputViewProps {
  onGenerate: (text: string, files: File[], mode: QuizMode, count: number, settings: QuizSettings) => void;
  isGenerating: boolean;
  userName?: string;
}

export const InputView: React.FC<InputViewProps> = ({ onGenerate, isGenerating, userName = "Student" }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [quizMode, setQuizMode] = useState<QuizMode>('MIXED');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'MEDIUM',
    timeLimit: 0,
    allowedTypes: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.MATCHING, QuestionType.ORDERING, QuestionType.FILL_IN_THE_BLANK, QuestionType.FLASHCARD]
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
    { id: 'MIXED', label: 'Mixed', sub: 'Best variety', icon: <Shuffle size={20} />, color: 'text-[#FBBC05]', bg: 'bg-[#FBBC05]' },
    { id: 'FLASHCARD', label: 'Flashcards', sub: 'Flip & Learn', icon: <GalleryVerticalEnd size={20} />, color: 'text-pink-500', bg: 'bg-pink-500' },
    { id: 'CONCEPTUAL', label: 'Deep Work', sub: 'Match & Order', icon: <BrainCircuit size={20} />, color: 'text-purple-500', bg: 'bg-purple-500' },
    { id: 'FILL_IN_THE_BLANK', label: 'Blanks', sub: 'Complete it', icon: <MinusSquare size={20} />, color: 'text-cyan-500', bg: 'bg-cyan-500' },
    { id: 'MULTIPLE_CHOICE', label: 'Choices', sub: 'Standard MC', icon: <ListChecks size={20} />, color: 'text-[#4285F4]', bg: 'bg-[#4285F4]' },
    { id: 'TRUE_FALSE', label: 'True/False', sub: 'Quick check', icon: <CheckSquare size={20} />, color: 'text-[#34A853]', bg: 'bg-[#34A853]' },
    { id: 'SHORT_ANSWER', label: 'Short', sub: 'Type answers', icon: <Type size={20} />, color: 'text-[#EA4335]', bg: 'bg-[#EA4335]' },
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
      />

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-8">
        
        {/* Welcome / Surprise Banner */}
        <div 
            onClick={handleSurpriseMe}
            className="group cursor-pointer relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-violet-600 to-indigo-600 p-5 md:p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 mb-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
        >
            <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg md:text-xl font-bold mb-1 leading-tight">Ready to learn, {userName}?</h2>
                    <p className="text-indigo-100 text-xs md:text-sm font-medium">Tap here for a surprise topic.</p>
                </div>
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors shrink-0">
                    <Dice5 size={22} className="text-white group-hover:rotate-180 transition-transform duration-500" />
                </div>
            </div>
            <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        {/* Source Input */}
        <section className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Material</span>
                {files.length > 0 && <span className="text-[10px] font-bold text-[#34A853] bg-[#34A853]/10 px-2 py-0.5 rounded-md animate-in scale-in">{files.length} attached</span>}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#4285F4]/50 focus-within:border-[#4285F4] transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md group">
                <textarea
                    className="w-full h-28 md:h-32 p-4 bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none outline-none text-base font-medium rounded-2xl leading-relaxed"
                    placeholder="Paste notes, topics, or text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isGenerating}
                />
                
                {files.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 no-scrollbar">
                        {files.map((file, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-sm group animate-in scale-in bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {file.type === 'application/pdf' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
                                    <FileText size={20} className="text-red-500 dark:text-red-400" />
                                    <span className="text-[8px] font-bold text-red-500 dark:text-red-400 mt-1 uppercase">PDF</span>
                                </div>
                            ) : (
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            )}
                            <button
                            onClick={() => removeFile(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                            <X size={14} className="text-white" />
                            </button>
                        </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center px-2 py-2 border-t border-slate-200/50 dark:border-slate-700">
                    <div className="flex items-center gap-2 pl-2">
                        <Type size={16} className={text ? "text-[#4285F4]" : "text-slate-300 dark:text-slate-600"} />
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">{text.length} chars</span>
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
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <Paperclip size={14} />
                            <span>Add File</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        {/* Quiz Mode Selector - Redesigned */}
        <section className="mb-6">
             <div className="flex items-center justify-between mb-4 px-1">
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quiz Mode</span>
               <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors uppercase tracking-wider"
               >
                   <SlidersHorizontal size={12} />
                   <span>Config</span>
               </button>
             </div>

             {/* Even scrolling list for mobile, grid for desktop */}
             <div className="flex overflow-x-auto pb-4 gap-3 -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-7 md:overflow-visible md:pb-0 no-scrollbar snap-x snap-mandatory">
                {quizModes.map((mode, idx) => {
                    const isActive = quizMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => setQuizMode(mode.id)}
                            className={`snap-center flex-shrink-0 min-w-[120px] md:min-w-0 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 relative group
                            ${isActive 
                                ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-xl shadow-indigo-100 dark:shadow-none scale-100 ring-2 ring-indigo-500/20' 
                                : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 ${isActive ? 'scale-110 shadow-sm' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'} ${mode.bg}/10 ${mode.color}`}>
                                {mode.icon}
                            </div>
                            <div className={`text-sm font-bold mb-0.5 ${isActive ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'}`}>
                                {mode.label}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-600">
                                {mode.sub}
                            </div>
                            {isActive && (
                                <div className="absolute top-3 right-3">
                                    <span className={`flex w-2 h-2 rounded-full ${mode.bg}`}></span>
                                </div>
                            )}
                        </button>
                    );
                })}
             </div>

             <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors mt-2 md:mt-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Question Count</span>
                    <span className="text-lg font-black text-[#4285F4]">{questionCount}</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4285F4] hover:accent-[#3367d6] transition-all"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    <span>Quick</span>
                    <span>Standard</span>
                    <span>Deep Dive</span>
                </div>
             </div>
        </section>

        {/* Action Button */}
        <section className="mt-4 pb-6">
            <Button 
                fullWidth 
                size="lg" 
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={!text.trim() && files.length === 0}
                className={`bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 py-4 text-lg font-bold rounded-2xl transition-all active:scale-[0.98] ${isGenerating ? 'animate-pulse' : ''}`}
                icon={<Sparkles size={18} className="text-blue-200" />}
            >
                {isGenerating ? 'Analyzing Material...' : 'Generate Quiz'}
            </Button>
        </section>

      </div>
    </div>
  );
};
