
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizResult, QuestionType } from '../types';
import { Button } from './Button';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, BookOpen, Baby, CheckSquare, ListChecks, Type, X, Clock, AlertTriangle, ArrowUpDown, Split, Youtube, GripVertical, Link2, ChevronUp, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  questions: QuizQuestion[];
  onFinish: (result: QuizResult) => void;
  onExit: () => void;
  timeLimit?: number; // per question in seconds
}

// Fuzzy matching logic
const checkShortAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const u = normalize(userAnswer);
  const c = normalize(correctAnswer);
  
  if (!u) return false;
  if (u === c) return true;
  
  if (c.length > 3 && u.includes(c)) return true;
  if (u.length > 3 && c.includes(u)) return true;

  const track = Array(c.length + 1).fill(null).map(() => Array(u.length + 1).fill(null));
  for (let i = 0; i <= c.length; i += 1) { track[i][0] = i; }
  for (let j = 0; j <= u.length; j += 1) { track[0][j] = j; }
  for (let i = 1; i <= c.length; i += 1) {
    for (let j = 1; j <= u.length; j += 1) {
      const indicator = c[i - 1] === u[j - 1] ? 0 : 1;
      track[i][j] = Math.min(
        track[i][j - 1] + 1,
        track[i - 1][j] + 1,
        track[i - 1][j - 1] + indicator,
      );
    }
  }
  const distance = track[c.length][u.length];
  return distance <= Math.max(2, Math.max(u.length, c.length) * 0.3);
};

export const QuizView: React.FC<QuizViewProps> = ({ questions, onFinish, onExit, timeLimit = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [explanationMode, setExplanationMode] = useState<'standard' | 'simple'>('standard');
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // New States for Advanced Types
  const [orderingState, setOrderingState] = useState<string[]>([]);
  const [matchingState, setMatchingState] = useState<{
    matches: Record<string, string>; // Left -> Right
    selectedLeft: string | null;
    shuffledRight: string[];
  }>({ matches: {}, selectedLeft: null, shuffledRight: [] });

  const currentQuestion = questions[currentIndex];
  
  const isShortAnswer = currentQuestion?.type === QuestionType.SHORT_ANSWER;
  const isOrdering = currentQuestion?.type === QuestionType.ORDERING;
  const isMatching = currentQuestion?.type === QuestionType.MATCHING;

  // Initialize Question State
  useEffect(() => {
    // Reset Standard State
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShortAnswerText('');
    setShowHint(false);
    setExplanationMode('standard');
    setIsCurrentCorrect(false);
    setIsShaking(false);
    setIsTimeUp(false);
    
    // Reset Timer
    if (timeLimit > 0) {
        setTimeLeft(timeLimit);
    }

    // Initialize Ordering
    if (currentQuestion?.type === QuestionType.ORDERING && currentQuestion.orderingItems) {
        const shuffled = [...currentQuestion.orderingItems].sort(() => Math.random() - 0.5);
        setOrderingState(shuffled);
    }

    // Initialize Matching
    if (currentQuestion?.type === QuestionType.MATCHING && currentQuestion.matchingPairs) {
        const rightSide = currentQuestion.matchingPairs.map(p => p.right);
        setMatchingState({
            matches: {},
            selectedLeft: null,
            shuffledRight: rightSide.sort(() => Math.random() - 0.5)
        });
    }

  }, [currentIndex, timeLimit, currentQuestion]);

  // Timer Logic
  useEffect(() => {
    if (timeLimit > 0 && !isAnswerRevealed && timeLeft > 0) {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
    } else if (timeLeft === 0 && !isAnswerRevealed && timeLimit > 0) {
        setIsTimeUp(true);
        handleCheckAnswer(true);
    }

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isAnswerRevealed, timeLimit]);


  if (!currentQuestion) return null;

  const handleCheckAnswer = (forcedByTimeout: boolean = false) => {
    let correct = false;
    
    if (forcedByTimeout) {
        correct = false;
    } else if (isShortAnswer) {
      correct = checkShortAnswer(shortAnswerText, currentQuestion.correctAnswer);
    } else if (isOrdering) {
        const currentString = JSON.stringify(orderingState);
        const correctString = JSON.stringify(currentQuestion.orderingItems);
        correct = currentString === correctString;
    } else if (isMatching) {
        if (!currentQuestion.matchingPairs) {
            correct = false;
        } else {
            const allMatched = currentQuestion.matchingPairs.every(pair => 
                matchingState.matches[pair.left] === pair.right
            );
            const allAssigned = Object.keys(matchingState.matches).length === currentQuestion.matchingPairs.length;
            correct = allMatched && allAssigned;
        }
    } else {
      // Comparison with trim for safety
      correct = selectedOption?.trim() === currentQuestion.correctAnswer?.trim();
    }
    
    setIsCurrentCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'],
        zIndex: 50,
      });
    } else if (!forcedByTimeout) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    }
    setIsAnswerRevealed(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      onFinish({
        score: score,
        totalQuestions: questions.length,
        correctAnswers: score,
        timeTaken
      });
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isAnswerRevealed) return;
    const newOrder = [...orderingState];
    if (direction === 'up' && index > 0) {
        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setOrderingState(newOrder);
  };

  const handleMatchClick = (side: 'left' | 'right', value: string) => {
    if (isAnswerRevealed) return;

    if (side === 'left') {
        if (matchingState.matches[value]) {
            // Deselect/Unmatch
            const newMatches = { ...matchingState.matches };
            delete newMatches[value];
            setMatchingState(prev => ({ ...prev, matches: newMatches, selectedLeft: value }));
        } else {
            // Select new left
            setMatchingState(prev => ({ ...prev, selectedLeft: value }));
        }
    } else {
        // Clicking right side
        if (matchingState.selectedLeft) {
            // Check if this right value is already used by another left
            const existingLeft = Object.keys(matchingState.matches).find(key => matchingState.matches[key] === value);
            const newMatches = { ...matchingState.matches };
            if (existingLeft) delete newMatches[existingLeft]; 
            
            newMatches[matchingState.selectedLeft] = value;
            setMatchingState(prev => ({ ...prev, matches: newMatches, selectedLeft: null }));
        }
    }
  };

  const renderProgressBar = () => {
    if (questions.length > 20) {
        const progress = ((currentIndex + 1) / questions.length) * 100;
        return (
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner mt-3">
                <div 
                    className="h-full bg-gradient-to-r from-[#4285F4] to-[#34A853] transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                />
            </div>
        );
    }

    return (
        <div className="flex gap-1 md:gap-1.5 w-full mt-3">
            {questions.map((_, idx) => {
                const isActive = idx === currentIndex;
                const isCompleted = idx < currentIndex;
                let bgClass = "bg-slate-100 dark:bg-slate-700";
                if (isCompleted) bgClass = "bg-[#34A853]";
                if (isActive) bgClass = "bg-[#4285F4]";

                return (
                    <div key={idx} className="h-1.5 flex-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 relative shadow-sm transition-colors">
                        <div 
                            className={`absolute inset-0 transition-all duration-300 ${bgClass} ${isActive ? 'animate-pulse' : ''}`}
                        />
                    </div>
                );
            })}
        </div>
    );
  };

  const getQuestionTypeIcon = () => {
      switch(currentQuestion.type) {
          case QuestionType.ORDERING: return <ArrowUpDown size={12} />;
          case QuestionType.MATCHING: return <Split size={12} />;
          case QuestionType.MULTIPLE_CHOICE: return <ListChecks size={12} />;
          case QuestionType.TRUE_FALSE: return <CheckSquare size={12} />;
          default: return <Type size={12} />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
      
      {/* Compact Top Bar */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 shadow-sm z-20 border-b border-slate-100 dark:border-slate-700 transition-colors shrink-0">
        <div className="flex justify-between items-center">
             <button onClick={onExit} className="p-1.5 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1 group">
                <X size={18} className="group-hover:scale-110 transition-transform"/>
                <span className="text-xs font-bold">Exit</span>
             </button>
             
             {timeLimit > 0 ? (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold tabular-nums transition-colors text-xs ${
                    timeLeft <= 10 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                    <Clock size={14} />
                    <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
             ) : (
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Question <span className="text-[#4285F4] text-base">{currentIndex + 1}</span> <span className="text-slate-300 dark:text-slate-600">/</span> {questions.length}
                </div>
             )}
        </div>
        
        {renderProgressBar()}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        
        {/* Compact Question Card */}
        <div className={`bg-white dark:bg-slate-800 p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all duration-300 ${isShaking ? 'animate-shake ring-2 ring-red-200 dark:ring-red-900' : ''}`}>
           <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide
                ${currentQuestion.type === 'MULTIPLE_CHOICE' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                  currentQuestion.type === 'TRUE_FALSE' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                  currentQuestion.type === 'MATCHING' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                  currentQuestion.type === 'ORDERING' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                  'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}
              `}>
                 {getQuestionTypeIcon()}
                 {currentQuestion.type.replace('_', ' ')}
              </span>
           </div>
           
           <div className="max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
               <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
                 {currentQuestion.question}
               </h2>
           </div>
        </div>

        {/* Answer Section */}
        <div className="space-y-2.5">
            
            {/* ORDERING UI */}
            {isOrdering && (
                <div className="space-y-3 mt-4">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-2">Use arrows to arrange in order</p>
                    {orderingState.map((item, idx) => {
                        const isCorrectPos = isAnswerRevealed && item === currentQuestion.orderingItems?.[idx];
                        let borderColor = "border-slate-200 dark:border-slate-700";
                        let bgColor = "bg-white dark:bg-slate-800";
                        let rankColor = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
                        
                        if (isAnswerRevealed) {
                            borderColor = isCorrectPos ? "border-[#34A853]" : "border-[#EA4335]";
                            bgColor = isCorrectPos ? "bg-[#34A853]/5 dark:bg-[#34A853]/10" : "bg-[#EA4335]/5 dark:bg-[#EA4335]/10";
                            rankColor = isCorrectPos ? "bg-[#34A853] text-white" : "bg-[#EA4335] text-white";
                        }

                        return (
                            <div key={idx} className={`relative flex items-center gap-3 p-3 md:p-4 rounded-2xl border-2 transition-all shadow-sm ${borderColor} ${bgColor}`}>
                                {/* Rank */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${rankColor}`}>
                                    {idx + 1}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base leading-snug">
                                    {item}
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col gap-1.5 ml-1">
                                    <button 
                                        disabled={isAnswerRevealed || idx === 0}
                                        onClick={() => moveItem(idx, 'up')} 
                                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-[#4285F4] hover:text-white disabled:opacity-20 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 transition-colors"
                                    >
                                        <ChevronUp size={16} strokeWidth={3}/>
                                    </button>
                                    <button 
                                        disabled={isAnswerRevealed || idx === orderingState.length - 1}
                                        onClick={() => moveItem(idx, 'down')} 
                                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-[#4285F4] hover:text-white disabled:opacity-20 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 transition-colors"
                                    >
                                        <ChevronDown size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MATCHING UI */}
            {isMatching && currentQuestion.matchingPairs && (
                <div className="mt-4">
                     <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-4">Tap a left item, then its match</p>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {/* Terms Column */}
                        <div className="space-y-3">
                            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 text-center uppercase mb-1">Terms</span>
                            {currentQuestion.matchingPairs.map((pair, idx) => {
                                const isSelected = matchingState.selectedLeft === pair.left;
                                const isMatched = !!matchingState.matches[pair.left];
                                
                                let containerClass = "relative w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between min-h-[64px] group ";
                                
                                if (isAnswerRevealed) {
                                    const matchedRight = matchingState.matches[pair.left];
                                    const isCorrect = matchedRight === pair.right;
                                    containerClass += isCorrect 
                                        ? "border-[#34A853] bg-[#34A853]/10 text-[#34A853]" 
                                        : "border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]";
                                } else {
                                    if (isSelected) {
                                        containerClass += "border-[#4285F4] bg-[#4285F4] text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 scale-105 z-10 ring-2 ring-offset-2 ring-[#4285F4]";
                                    } else if (isMatched) {
                                        containerClass += "border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
                                    } else {
                                        containerClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#4285F4]/50 hover:bg-slate-50 dark:hover:bg-slate-700";
                                    }
                                }

                                return (
                                    <button key={idx} onClick={() => handleMatchClick('left', pair.left)} disabled={isAnswerRevealed} className={containerClass}>
                                        <span className="text-xs md:text-sm font-bold leading-tight">{pair.left}</span>
                                        {isMatched && !isSelected && <Link2 size={14} className="opacity-50 shrink-0 ml-2"/>}
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-2"></div>}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Definitions Column */}
                        <div className="space-y-3">
                            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 text-center uppercase mb-1">Definitions</span>
                            {matchingState.shuffledRight.map((item, idx) => {
                                 const matchedLeftKey = Object.keys(matchingState.matches).find(k => matchingState.matches[k] === item);
                                 const isMatched = !!matchedLeftKey;
                                 
                                 let containerClass = "relative w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between min-h-[64px] ";
                                 
                                 if (isAnswerRevealed) {
                                     if (matchedLeftKey) {
                                         const correctRight = currentQuestion.matchingPairs?.find(p => p.left === matchedLeftKey)?.right;
                                         const isCorrect = correctRight === item;
                                         containerClass += isCorrect 
                                            ? "border-[#34A853] bg-[#34A853]/10 text-[#34A853]" 
                                            : "border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]";
                                     } else {
                                         containerClass += "border-slate-200 dark:border-slate-700 opacity-40 grayscale";
                                     }
                                 } else {
                                     if (isMatched) {
                                        containerClass += "border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
                                     } else {
                                         // If left selected, highlight valid targets subtly
                                        const isValidTarget = matchingState.selectedLeft; 
                                        containerClass += isValidTarget 
                                            ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#4285F4] hover:shadow-md" 
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800";
                                     }
                                 }
                                 
                                 return (
                                    <button key={idx} onClick={() => handleMatchClick('right', item)} disabled={isAnswerRevealed} className={containerClass}>
                                        <span className="text-xs md:text-sm font-medium leading-tight">{item}</span>
                                        {isMatched && <Link2 size={14} className="opacity-50 shrink-0 ml-2"/>}
                                    </button>
                                 )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Options (MC, T/F) */}
            {(!isShortAnswer && !isOrdering && !isMatching) && (
                currentQuestion.options.map((option, idx) => {
                    let baseClasses = "w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden transform active:scale-[0.98]";
                    let stateClasses = "bg-white dark:bg-slate-800 border-transparent shadow-sm hover:border-[#4285F4]/30 hover:bg-[#4285F4]/5 dark:hover:bg-[#4285F4]/10 hover:shadow-md";
                    let textClasses = "text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base relative z-10";

                    if (isAnswerRevealed) {
                        // Safe trimmed comparison
                        const isCorrectOption = option.trim() === currentQuestion.correctAnswer?.trim();
                        const isSelectedOption = option === selectedOption;

                        if (isCorrectOption) {
                            stateClasses = "bg-[#34A853]/10 dark:bg-[#34A853]/20 border-[#34A853] shadow-none";
                            textClasses = "text-[#34A853] dark:text-[#34A853] font-bold";
                        } else if (isSelectedOption) {
                            stateClasses = "bg-[#EA4335]/10 dark:bg-[#EA4335]/20 border-[#EA4335] shadow-none";
                            textClasses = "text-[#EA4335] dark:text-[#EA4335] font-medium";
                        } else {
                            stateClasses = "bg-slate-50 dark:bg-slate-900 border-transparent opacity-50 grayscale";
                        }
                    } else if (selectedOption === option) {
                        stateClasses = "bg-[#4285F4] border-[#4285F4] shadow-md shadow-blue-200 dark:shadow-blue-900/50 scale-[1.02] active:scale-[0.98]";
                        textClasses = "text-white font-bold";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => !isAnswerRevealed && setSelectedOption(option)}
                            disabled={isAnswerRevealed}
                            className={`${baseClasses} ${stateClasses}`}
                            style={{ transitionDelay: `${idx * 50}ms` }}
                        >
                            <span className={textClasses}>{option}</span>
                            {isAnswerRevealed && option.trim() === currentQuestion.correctAnswer?.trim() && (
                                <CheckCircle2 size={18} className="text-[#34A853] animate-in scale-in" />
                            )}
                            {isAnswerRevealed && option === selectedOption && option.trim() !== currentQuestion.correctAnswer?.trim() && (
                                <XCircle size={18} className="text-[#EA4335] animate-in scale-in" />
                            )}
                        </button>
                    )
                })
            )}

            {isShortAnswer && (
                <div className="relative">
                    <textarea 
                        className={`w-full p-4 rounded-xl border-2 bg-white dark:bg-slate-800 outline-none h-32 resize-none text-base transition-all duration-200
                            ${isAnswerRevealed 
                                ? (isCurrentCorrect ? 'border-[#34A853] text-[#34A853] bg-[#34A853]/5' : 'border-[#EA4335] text-[#EA4335] bg-[#EA4335]/5') 
                                : 'border-dashed border-slate-300 dark:border-slate-600 focus:border-[#4285F4] text-slate-700 dark:text-slate-200 focus:shadow-md focus:bg-slate-50 dark:focus:bg-slate-800'}
                        `}
                        placeholder="Type answer..."
                        value={shortAnswerText}
                        onChange={(e) => setShortAnswerText(e.target.value)}
                        disabled={isAnswerRevealed}
                    />
                    {isAnswerRevealed && (
                        <div className="absolute top-3 right-3 animate-in scale-in">
                            {isCurrentCorrect ? <CheckCircle2 className="text-[#34A853]" size={20}/> : <XCircle className="text-[#EA4335]" size={20}/>}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Hint & Explanation */}
        <div className="mt-4 space-y-3">
            {!isAnswerRevealed && !showHint && !isTimeUp && (
                <button 
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#FBBC05] bg-[#FBBC05]/10 px-3 py-2 rounded-xl hover:bg-[#FBBC05]/20 transition-all mx-auto hover:scale-105 active:scale-95"
                >
                    <Lightbulb size={14} />
                    <span>Show Hint</span>
                </button>
            )}

            {showHint && !isAnswerRevealed && (
                <div className="bg-[#FBBC05]/10 border border-[#FBBC05]/20 p-3 rounded-xl animate-in fade-in slide-up">
                    <div className="flex items-start gap-2">
                        <Lightbulb size={16} className="text-[#f9ab00] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#b47a00] dark:text-[#f9ab00] font-medium leading-relaxed">{currentQuestion.hint}</p>
                    </div>
                </div>
            )}

            {isAnswerRevealed && (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-[1.25rem] shadow-sm animate-in slide-up overflow-hidden relative">
                    <div className={`flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wide
                        ${isCurrentCorrect ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                        {isCurrentCorrect ? 'Correct!' : (isTimeUp ? 'Time Up!' : 'Incorrect')}
                    </div>
                    
                    {isTimeUp && !isCurrentCorrect && (
                         <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl mb-3 text-xs font-semibold">
                             <AlertTriangle size={14} />
                             <span>You ran out of time!</span>
                         </div>
                    )}

                    {/* Standard Correct Answer Display for MC, TF, Short Answer */}
                    {(!isCurrentCorrect || isShortAnswer) && !isOrdering && !isMatching && (
                         <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">Correct Answer</span>
                            <p className="text-slate-800 dark:text-slate-100 font-bold text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                {currentQuestion.correctAnswer}
                            </p>
                         </div>
                    )}
                    
                    {/* Correct Sequence for Ordering */}
                    {isOrdering && !isCurrentCorrect && (
                         <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">Correct Sequence</span>
                             <ol className="list-decimal list-inside text-xs text-slate-800 dark:text-slate-100 font-semibold space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                {currentQuestion.orderingItems?.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                             </ol>
                         </div>
                    )}

                    {/* Correct Matches for Matching - Newly Added */}
                    {isMatching && !isCurrentCorrect && (
                        <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">Correct Matches</span>
                        <div className="grid grid-cols-1 gap-1">
                            {currentQuestion.matchingPairs?.map((pair, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pair.left}</span>
                                    <ArrowRight size={12} className="text-slate-400 mx-2" />
                                    <span className="font-bold text-[#34A853]">{pair.right}</span>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                         <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                            {explanationMode === 'standard' ? <BookOpen size={16} className="text-[#4285F4]"/> : <Baby size={16} className="text-[#4285F4]"/>}
                            Explanation
                         </h4>
                         {currentQuestion.simpleExplanation && (
                             <button 
                                onClick={() => setExplanationMode(prev => prev === 'standard' ? 'simple' : 'standard')}
                                className="text-[9px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                             >
                                 Switch to {explanationMode === 'standard' ? 'Simple' : 'Academic'}
                             </button>
                         )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed transition-opacity duration-300 mb-3">
                        {explanationMode === 'standard' ? currentQuestion.explanation : currentQuestion.simpleExplanation}
                    </p>

                    {currentQuestion.searchQuery && (
                         <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuestion.searchQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-bold text-xs"
                         >
                             <Youtube size={16} />
                             <span>Watch Lesson Clip</span>
                         </a>
                    )}
                    
                     <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] opacity-20 pointer-events-none 
                        ${isCurrentCorrect ? 'bg-[#34A853]' : 'bg-[#EA4335]'}`} 
                     />
                </div>
            )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 z-30 transition-colors">
        {!isAnswerRevealed ? (
             <Button 
                fullWidth 
                size="lg" 
                onClick={() => handleCheckAnswer(false)}
                disabled={(!isShortAnswer && !isMatching && !isOrdering && !selectedOption) || (isShortAnswer && !shortAnswerText.trim()) || (isMatching && Object.keys(matchingState.matches).length === 0)}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 rounded-2xl py-3 shadow-xl shadow-slate-200 dark:shadow-none transform active:scale-[0.98] transition-all"
            >
                Check Answer
            </Button>
        ) : (
            <Button 
                fullWidth 
                size="lg" 
                onClick={handleNext}
                className="bg-[#4285F4] text-white hover:bg-[#3367d6] rounded-2xl py-3 shadow-xl shadow-blue-200 dark:shadow-blue-900/50 transform active:scale-[0.98] transition-all"
                icon={<ArrowRight size={20} />}
            >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
        )}
      </div>
    </div>
  );
};
