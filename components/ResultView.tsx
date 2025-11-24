
import React, { useState, useEffect } from 'react';
import { QuizResult } from '../types';
import { Button } from './Button';
import { RotateCcw, Plus, Trophy, Clock, CheckCircle2, Target, Flame, Star, Award, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultViewProps {
  result: QuizResult;
  onRetry: () => void;
  onNew: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onRetry, onNew }) => {
  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const [displayXp, setDisplayXp] = useState(0);
  
  // Calculate Grade
  let grade = 'F';
  let gradeColor = 'text-red-500';
  let gradeBg = 'bg-red-500';
  
  if (percentage >= 100) { grade = 'S'; gradeColor = 'text-yellow-500'; gradeBg = 'bg-yellow-500'; }
  else if (percentage >= 90) { grade = 'A'; gradeColor = 'text-green-500'; gradeBg = 'bg-green-500'; }
  else if (percentage >= 80) { grade = 'B'; gradeColor = 'text-blue-500'; gradeBg = 'bg-blue-500'; }
  else if (percentage >= 70) { grade = 'C'; gradeColor = 'text-indigo-500'; gradeBg = 'bg-indigo-500'; }
  else if (percentage >= 60) { grade = 'D'; gradeColor = 'text-orange-500'; gradeBg = 'bg-orange-500'; }

  // Confetti effect on mount if high score
  useEffect(() => {
    if (percentage >= 70) {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [percentage]);

  // XP Count up animation
  useEffect(() => {
    let start = 0;
    const end = result.xpEarned || 0;
    const duration = 1500;
    if (end === 0) return;
    
    const stepTime = Math.max(10, Math.floor(duration / end));
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 50);
      if (start >= end) {
          start = end;
          clearInterval(timer);
      }
      setDisplayXp(start);
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [result.xpEarned]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      
      {/* Hero Section - Compacted */}
      <div className="relative z-10 bg-white dark:bg-slate-800 rounded-b-[2rem] shadow-xl pb-6 pt-6 px-6 text-center border-b border-slate-100 dark:border-slate-700 shrink-0">
          
          <div className="inline-block relative mb-3">
               {/* Grade Circle - Smaller */}
               <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black border-[6px] border-slate-100 dark:border-slate-700 shadow-inner ${gradeColor}`}>
                   {grade}
               </div>
               {percentage >= 100 && (
                   <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                       <Award size={20} fill="currentColor" />
                   </div>
               )}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-0.5 tracking-tight">
              {percentage >= 90 ? 'Quiz Mastered!' : percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-4">
              {percentage >= 90 ? 'You crushed it perfectly.' : 'You are on the right track.'}
          </p>
          
          {/* XP Pill - Compact */}
          <div className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-full shadow-lg transform hover:scale-105 transition-transform cursor-default">
              <Star size={14} className="fill-current animate-spin-slow" />
              <span className="font-bold text-sm">+{displayXp} XP</span>
          </div>

      </div>

      {/* Stats Grid - Compacted */}
      <div className="flex-1 overflow-y-auto p-4 animate-in slide-up delay-100 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
              
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1.5 text-blue-500 mb-0.5">
                      <Target size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Accuracy</span>
                  </div>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{percentage}%</span>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${gradeBg}`} style={{ width: `${percentage}%` }}></div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1.5 text-purple-500 mb-0.5">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Time</span>
                  </div>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{result.timeTaken}s</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Speedy!</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-orange-500 mb-0.5">
                        <Flame size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Answer Streak</span>
                    </div>
                    <TrendingUp size={14} className="text-green-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-800 dark:text-white">{result.correctAnswers}</span>
                      <span className="text-[10px] font-semibold text-slate-400">Correct Answers</span>
                  </div>
              </div>

          </div>
      </div>

      {/* Action Footer - Compact */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-2 z-10 transition-colors shrink-0">
        <Button 
            fullWidth 
            onClick={onNew} 
            className="bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-xl py-3 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-[0.98] transition-transform text-sm font-bold"
            icon={<Plus size={18} />}
        >
          New Quiz
        </Button>
        <Button 
            fullWidth 
            variant="ghost" 
            onClick={onRetry} 
            className="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl py-2.5 active:scale-[0.98] transition-transform text-xs font-bold"
            icon={<RotateCcw size={16} />}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};
