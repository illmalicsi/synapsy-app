import React from 'react';
import { X, Clock, BarChart2, CheckSquare, Zap, Layers, Split, ArrowUpDown } from 'lucide-react';
import { Button } from './Button';
import { Difficulty, QuizSettings, QuestionType, QuizMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuizSettings;
  onUpdateSettings: (s: QuizSettings) => void;
  quizMode: QuizMode;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  quizMode
}) => {
  if (!isOpen) return null;

  const difficulties: { id: Difficulty; label: string; color: string; darkColor: string; icon: React.ReactNode }[] = [
    { id: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700 border-green-200', darkColor: 'dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: <Zap size={16} /> },
    { id: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', darkColor: 'dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: <BarChart2 size={16} /> },
    { id: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700 border-red-200', darkColor: 'dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: <Layers size={16} /> }
  ];

  const timeOptions = [0, 30, 60, 120];

  const toggleType = (type: QuestionType) => {
    const current = settings.allowedTypes;
    let next = [...current];
    if (current.includes(type)) {
      if (current.length > 1) next = next.filter(t => t !== type);
    } else {
      next.push(type);
    }
    onUpdateSettings({ ...settings, allowedTypes: next });
  };

  const questionTypesList = [
      { type: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice', icon: <CheckSquare size={14}/> },
      { type: QuestionType.TRUE_FALSE, label: 'True/False', icon: <Zap size={14}/> },
      { type: QuestionType.SHORT_ANSWER, label: 'Short Answer', icon: <Layers size={14}/> },
      { type: QuestionType.ORDERING, label: 'Ordering', icon: <ArrowUpDown size={14}/> },
      { type: QuestionType.MATCHING, label: 'Matching', icon: <Split size={14}/> },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 animate-in scale-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Difficulty Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-indigo-500 dark:text-indigo-400" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Difficulty</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => onUpdateSettings({ ...settings, difficulty: diff.id })}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                    settings.difficulty === diff.id
                      ? `${diff.color} ${diff.darkColor} border-current shadow-sm scale-105`
                      : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {diff.icon}
                  <span className="text-sm font-bold">{diff.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium px-1">
              {settings.difficulty === 'EASY' && "Straightforward questions testing basic recall."}
              {settings.difficulty === 'MEDIUM' && "Standard complexity requiring good understanding."}
              {settings.difficulty === 'HARD' && "Complex scenarios requiring analysis, synthesis, and deep drilling."}
            </p>
          </section>

          {/* Time Limit Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-teal-500 dark:text-teal-400" size={20} />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Time Per Question</h3>
            </div>
            <div className="space-y-4">
                <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="1"
                    value={timeOptions.indexOf(settings.timeLimit)}
                    onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        onUpdateSettings({ ...settings, timeLimit: timeOptions[idx] });
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <span className={settings.timeLimit === 0 ? "text-teal-600 dark:text-teal-400" : ""}>None</span>
                    <span className={settings.timeLimit === 30 ? "text-teal-600 dark:text-teal-400" : ""}>30s</span>
                    <span className={settings.timeLimit === 60 ? "text-teal-600 dark:text-teal-400" : ""}>1m</span>
                    <span className={settings.timeLimit === 120 ? "text-teal-600 dark:text-teal-400" : ""}>2m</span>
                </div>
            </div>
          </section>

          {/* Question Types (Conditional) */}
          <section className={`transition-opacity duration-300 ${quizMode !== 'MIXED' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Layers className="text-rose-500 dark:text-rose-400" size={20} />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Mixed Mode Types</h3>
                </div>
                {quizMode !== 'MIXED' && <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-2 py-1 rounded">Mixed Mode Only</span>}
             </div>
             
             <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-700 space-y-1">
                {questionTypesList.map((item) => (
                    <div 
                        key={item.type}
                        onClick={() => toggleType(item.type)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 dark:text-slate-500">{item.icon}</span>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {item.label}
                            </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            settings.allowedTypes.includes(item.type) 
                            ? 'bg-rose-500 border-rose-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                            {settings.allowedTypes.includes(item.type) && <CheckSquare size={12} />}
                        </div>
                    </div>
                ))}
             </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Button fullWidth onClick={onClose} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 rounded-xl">
            Done
          </Button>
        </div>

      </div>
    </div>
  );
};
