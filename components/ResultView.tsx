import React, { useState, useEffect } from 'react';
import { QuizResult } from '../types';
import { Button } from './Button';
import { RotateCcw, Plus, Trophy, Clock, CheckCircle2, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultViewProps {
  result: QuizResult;
  onRetry: () => void;
  onNew: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onRetry, onNew }) => {
  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const [displayPercent, setDisplayPercent] = useState(0);
  
  // Confetti effect on mount if high score
  useEffect(() => {
    if (percentage >= 70) {
      const duration = 3000;
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

  // Count up animation
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    if (percentage === 0) return;
    
    const stepTime = Math.max(10, Math.floor(duration / percentage));
    
    const timer = setInterval(() => {
      start += 1;
      setDisplayPercent(start);
      if (start >= percentage) clearInterval(timer);
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [percentage]);

  let message = "Good effort!";
  let subMessage = "Keep practicing to improve.";
  if (percentage >= 90) { message = "Outstanding!"; subMessage = "You've mastered this topic."; }
  else if (percentage >= 70) { message = "Great Job!"; subMessage = "You're getting really good at this."; }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 relative overflow-hidden transition-colors duration-300">
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in scale-in duration-500">
          
          <div className="relative mb-8 transform transition-transform hover:scale-105 duration-300">
             <div className={`w-36 h-36 rounded-full flex items-center justify-center text-4xl font-black border-[10px] shadow-2xl dark:shadow-none transition-all duration-1000 ${
                 percentage >= 70 
                 ? 'border-[#34A853] text-[#34A853] bg-[#34A853]/5 dark:bg-[#34A853]/10 shadow-green-200' 
                 : 'border-[#FBBC05] text-[#FBBC05] bg-[#FBBC05]/5 dark:bg-[#FBBC05]/10 shadow-yellow-200'
             }`}>
                 {displayPercent}%
             </div>
             {percentage >= 90 && (
                 <div className="absolute -top-4 -right-4 bg-[#FBBC05] text-white p-3 rounded-full shadow-lg rotate-12 animate-bounce">
                     <Trophy size={28} fill="white" />
                 </div>
             )}
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight animate-in slide-up delay-100">{message}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-center max-w-[250px] animate-in slide-up delay-200">{subMessage}</p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8 animate-in slide-up delay-300">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center transition-transform hover:-translate-y-1">
                  <div className="text-slate-400 dark:text-slate-500 mb-2"><Target size={20} /></div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result.correctAnswers}/{result.totalQuestions}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center transition-transform hover:-translate-y-1">
                  <div className="text-slate-400 dark:text-slate-500 mb-2"><Clock size={20} /></div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result.timeTaken}s</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Time</span>
              </div>
          </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-3 z-10 transition-colors">
        <Button 
            fullWidth 
            onClick={onNew} 
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-2xl py-4 shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-transform"
            icon={<Plus size={20} />}
        >
          New Quiz
        </Button>
        <Button 
            fullWidth 
            variant="ghost" 
            onClick={onRetry} 
            className="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl py-3 active:scale-[0.98] transition-transform"
            icon={<RotateCcw size={18} />}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};