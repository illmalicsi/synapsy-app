
import React, { useMemo } from 'react';
import { QuizHistoryItem } from '../types';
import { ArrowLeft, Clock, Calendar, BarChart2, Target, Zap, BrainCircuit, ListChecks, CheckSquare, Type } from 'lucide-react';

interface HistoryViewProps {
  history: QuizHistoryItem[];
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack }) => {
  
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const totalQuizzes = history.length;
    const totalQuestions = history.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = Math.round((totalScore / totalQuestions) * 100) || 0;
    const totalTime = history.reduce((acc, curr) => acc + curr.timeTaken, 0);
    
    return { totalQuizzes, averageScore, totalTime };
  }, [history]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeIcon = (mode: string) => {
    switch(mode) {
        case 'CONCEPTUAL': return <BrainCircuit size={14} />;
        case 'MULTIPLE_CHOICE': return <ListChecks size={14} />;
        case 'TRUE_FALSE': return <CheckSquare size={14} />;
        case 'SHORT_ANSWER': return <Type size={14} />;
        default: return <Zap size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative animate-in fade-in transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-6 py-4 shadow-sm z-20 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-0">
         <div className="flex items-center gap-3">
             <button 
               onClick={onBack}
               className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
             >
                 <ArrowLeft size={20} />
             </button>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">History</h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Your Learning Journey</span>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20">
        
        {/* Stats Summary */}
        {stats && (
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-indigo-500">{stats.totalQuizzes}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Quizzes</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#34A853]">{stats.averageScore}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Avg Score</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#FBBC05]">{Math.round(stats.totalTime / 60)}m</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Time Spent</span>
                </div>
            </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
            {history.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={24} />
                    </div>
                    <p className="font-semibold">No history yet.</p>
                    <p className="text-sm">Complete a quiz to see it here!</p>
                </div>
            ) : (
                history.map((item, idx) => (
                    <div 
                        key={item.id} 
                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md group animate-in slide-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1 pr-4">
                                    {item.topic}
                                </h3>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {formatDate(item.timestamp)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className={`uppercase ${
                                        item.difficulty === 'EASY' ? 'text-green-500' : 
                                        item.difficulty === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                        {item.difficulty}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end`}>
                                <span className={`text-lg font-black ${
                                    (item.score / item.totalQuestions) >= 0.7 ? 'text-[#34A853]' : 'text-[#EA4335]'
                                }`}>
                                    {Math.round((item.score / item.totalQuestions) * 100)}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    {item.score}/{item.totalQuestions}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide">
                                 {getModeIcon(item.mode)}
                                 {item.mode.replace('_', ' ')}
                             </div>
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide ml-auto">
                                 <Clock size={12} />
                                 {item.timeTaken}s
                             </div>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
};
