
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizResult, QuestionType, QuizMode, QuizSettings } from '../types';
import { Button } from './Button';
import { validateExplanation } from '../services/geminiService';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, BookOpen, Baby, CheckSquare, ListChecks, Type, X, Clock, AlertTriangle, ArrowUpDown, Split, Youtube, Link2, GripVertical, GalleryVerticalEnd, RotateCw, MinusSquare, Sword, Heart, Skull, Send, BrainCircuit } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  questions: QuizQuestion[];
  onFinish: (result: QuizResult) => void;
  onExit: () => void;
  timeLimit?: number; 
  mode: QuizMode;
  settings?: QuizSettings;
}

// Helper: Normalize strings for robust comparison (MC/TF)
const normalizeOptionText = (text: string | undefined): string => {
  if (!text) return '';
  let s = text.toLowerCase().trim();
  s = s.replace(/[.,;!]+$/, ''); // Remove trailing punctuation
  // Require space after separator (e.g. "A. ", "1. ") to protect decimals like "3.14" from being stripped
  s = s.replace(/^[a-z0-9]+[.):-]\s+/, ''); 
  return s.trim();
};

const isOptionMatch = (opt1: string | undefined, opt2: string | undefined): boolean => {
    const n1 = normalizeOptionText(opt1);
    const n2 = normalizeOptionText(opt2);
    if (n1 === n2) return true;
    
    // Fuzzy match for longer strings (e.g. "Paris" vs "City of Paris")
    if (n1.length > 3 && n2.length > 3) {
        if (n1.includes(n2) || n2.includes(n1)) return true;
    }
    return false;
};

const checkTextAnswer = (userAnswer: string, correctAnswer: string | undefined): boolean => {
  if (!correctAnswer) return false;
  const normalize = (str: string | undefined) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  };
  const u = normalize(userAnswer);
  const c = normalize(correctAnswer);
  if (!u || !c) return false;
  if (u === c) return true;
  if (c.length > 3 && u.includes(c)) return true;
  if (u.length > 3 && c.includes(u)) return true;
  return false;
};

export const QuizView: React.FC<QuizViewProps> = ({ questions, onFinish, onExit, timeLimit = 0, mode, settings }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // Progressive hints
  const [explanationMode, setExplanationMode] = useState<'standard' | 'simple'>('standard');
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(3);
  const [bossAttackAnim, setBossAttackAnim] = useState(false);
  const [playerAttackAnim, setPlayerAttackAnim] = useState(false);

  // Explain It Back State
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [userExplanation, setUserExplanation] = useState('');
  const [explanationFeedback, setExplanationFeedback] = useState<{isCorrect: boolean, feedback: string} | null>(null);
  const [isCheckingExplanation, setIsCheckingExplanation] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const [orderingState, setOrderingState] = useState<{id: string, text: string}[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  const [matchingState, setMatchingState] = useState<{
    matches: Record<string, string>;
    selectedLeft: string | null;
    shuffledRight: string[];
  }>({ matches: {}, selectedLeft: null, shuffledRight: [] });

  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const currentQuestion = questions[currentIndex];
  
  const isShortAnswer = currentQuestion?.type === QuestionType.SHORT_ANSWER;
  const isFillInBlank = currentQuestion?.type === QuestionType.FILL_IN_THE_BLANK;
  const isOrdering = currentQuestion?.type === QuestionType.ORDERING;
  const isMatching = currentQuestion?.type === QuestionType.MATCHING;
  const isFlashcard = currentQuestion?.type === QuestionType.FLASHCARD;
  const isBossMode = mode === 'BOSS_BATTLE';

  useEffect(() => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setTextAnswer('');
    setShowHint(false);
    setHintLevel(0);
    setExplanationMode('standard');
    setIsCurrentCorrect(false);
    setIsShaking(false);
    setIsTimeUp(false);
    setDraggedIdx(null);
    setIsCardFlipped(false);
    setShowExplainModal(false);
    setUserExplanation('');
    setExplanationFeedback(null);
    setBossAttackAnim(false);
    setPlayerAttackAnim(false);
    
    if (timeLimit > 0) {
        setTimeLeft(timeLimit);
    }

    if (currentQuestion?.type === QuestionType.ORDERING && currentQuestion.orderingItems) {
        const shuffled = [...currentQuestion.orderingItems]
            .sort(() => Math.random() - 0.5)
            .map((text, i) => ({ id: `item-${i}-${Math.random().toString(36).substr(2, 9)}`, text }));
        setOrderingState(shuffled);
    }

    if (currentQuestion?.type === QuestionType.MATCHING && currentQuestion.matchingPairs) {
        const rightSide = currentQuestion.matchingPairs.map(p => p.right);
        setMatchingState({
            matches: {},
            selectedLeft: null,
            shuffledRight: rightSide.sort(() => Math.random() - 0.5)
        });
    }

  }, [currentIndex, timeLimit, currentQuestion]);

  useEffect(() => {
    if (timeLimit > 0 && !isAnswerRevealed && timeLeft > 0 && !isFlashcard) {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
    } else if (timeLeft === 0 && !isAnswerRevealed && timeLimit > 0 && !isFlashcard) {
        setIsTimeUp(true);
        handleCheckAnswer(true);
    }

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isAnswerRevealed, timeLimit, isFlashcard]);

  // Boss Death Check
  useEffect(() => {
     if (isBossMode && bossHealth <= 0) {
         // Boss Defeated Early
         confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
     }
  }, [bossHealth, isBossMode]);


  if (!currentQuestion) return null;

  const handleCheckAnswer = (forcedByTimeout: boolean = false, flashcardCorrect?: boolean) => {
    let correct = false;
    
    if (isFlashcard) {
        correct = !!flashcardCorrect;
    } else if (forcedByTimeout) {
        correct = false;
    } else if (isShortAnswer || isFillInBlank) {
      correct = checkTextAnswer(textAnswer, currentQuestion.correctAnswer);
    } else if (isOrdering) {
        const currentItems = orderingState.map(i => i.text);
        const currentString = JSON.stringify(currentItems);
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
      correct = isOptionMatch(selectedOption || '', currentQuestion.correctAnswer);
    }
    
    setIsCurrentCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
      
      if (isBossMode) {
          setPlayerAttackAnim(true);
          const damagePerHit = 100 / questions.length;
          setBossHealth(prev => {
              const next = prev - damagePerHit;
              // Snap to 0 if extremely close (floating point error fix)
              return next < 1 ? 0 : next;
          });
      } else {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'],
            zIndex: 50,
          });
      }
    } else if (!forcedByTimeout && !isFlashcard) {
        if (isBossMode) {
            setBossAttackAnim(true);
            setPlayerHealth(prev => Math.max(0, prev - 1));
        }
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    }
    setIsAnswerRevealed(true);

    // Trigger Explain It Back if enabled and user got it WRONG (or generally if configured)
    if (settings?.enableExplainItBack && !correct && !forcedByTimeout && !isFlashcard) {
        setTimeout(() => setShowExplainModal(true), 1500);
    }
  };

  const submitExplanation = async () => {
      setIsCheckingExplanation(true);
      try {
          const result = await validateExplanation(currentQuestion.question, currentQuestion.correctAnswer, userExplanation);
          setExplanationFeedback(result);
      } catch (e) {
          setExplanationFeedback({ isCorrect: false, feedback: "Could not verify." });
      } finally {
          setIsCheckingExplanation(false);
      }
  };

  const handleNext = () => {
    // Check for Game Over logic in boss mode
    if (isBossMode && playerHealth <= 0) {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        onFinish({
            score: score,
            totalQuestions: questions.length,
            correctAnswers: score,
            timeTaken,
            xpEarned: Math.floor(score * 5) // Reduced XP for failure
        });
        return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      let xp = score * 10;
      // Bonus only if boss actually died
      if (isBossMode && bossHealth <= 0) xp += 100; 
      else if (isBossMode && bossHealth > 0) xp = Math.floor(xp * 0.5); // Penalty if boss survived

      onFinish({
        score: score,
        totalQuestions: questions.length,
        correctAnswers: score,
        timeTaken,
        xpEarned: xp
      });
    }
  };

  const handleHint = () => {
      if (hintLevel === 0) {
          setShowHint(true);
          setHintLevel(1);
      } else if (hintLevel === 1) {
          setHintLevel(2);
      }
  };

  // Drag & Drop / Matching Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isAnswerRevealed) { e.preventDefault(); return; }
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (isAnswerRevealed) return;
    if (draggedIdx === null || draggedIdx === index) return;
    const newOrder = [...orderingState];
    const item = newOrder[draggedIdx];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(index, 0, item);
    setOrderingState(newOrder);
    setDraggedIdx(index);
  };
  const handleDragEnd = () => setDraggedIdx(null);
  const handleMatchClick = (side: 'left' | 'right', value: string) => {
    if (isAnswerRevealed) return;
    if (side === 'left') {
        if (matchingState.matches[value]) {
            const newMatches = { ...matchingState.matches };
            delete newMatches[value];
            setMatchingState(prev => ({ ...prev, matches: newMatches, selectedLeft: value }));
        } else {
            setMatchingState(prev => ({ ...prev, selectedLeft: value }));
        }
    } else {
        if (matchingState.selectedLeft) {
            const existingLeft = Object.keys(matchingState.matches).find(key => matchingState.matches[key] === value);
            const newMatches = { ...matchingState.matches };
            if (existingLeft) delete newMatches[existingLeft]; 
            newMatches[matchingState.selectedLeft] = value;
            setMatchingState(prev => ({ ...prev, matches: newMatches, selectedLeft: null }));
        }
    }
  };

  const renderProgressBar = () => {
      // If boss mode, show Health Bars instead of progress
      if (isBossMode) {
          return (
              <div className="flex justify-between items-center gap-4 w-full mt-1">
                  {/* Player HP */}
                  <div className="flex items-center gap-1">
                      <div className="flex">
                         {[...Array(3)].map((_, i) => (
                             <Heart key={i} size={16} className={`${i < playerHealth ? 'fill-red-500 text-red-500' : 'text-slate-200 dark:text-slate-700'} ${playerAttackAnim ? 'animate-bounce' : ''}`} />
                         ))}
                      </div>
                  </div>
                  
                  {/* VS */}
                  <div className="text-[10px] font-black text-slate-300">VS</div>

                  {/* Boss HP */}
                  <div className="flex-1 flex flex-col items-end">
                      <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Concept Boss</span>
                          <Skull size={14} className="text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full bg-gradient-to-l from-purple-600 to-indigo-500 transition-all duration-500 ${bossAttackAnim ? 'animate-pulse' : ''}`} 
                            style={{ width: `${bossHealth}%` }}
                          />
                      </div>
                  </div>
              </div>
          )
      }

      if (questions.length > 20) {
        const progress = ((currentIndex + 1) / questions.length) * 100;
        return (
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner mt-2">
                <div className="h-full bg-gradient-to-r from-[#4285F4] to-[#34A853] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
        );
      }
      return (
        <div className="flex gap-1 w-full mt-2">
            {questions.map((_, idx) => {
                const isActive = idx === currentIndex;
                const isCompleted = idx < currentIndex;
                let bgClass = "bg-slate-100 dark:bg-slate-700";
                if (isCompleted) bgClass = "bg-[#34A853]";
                if (isActive) bgClass = "bg-[#4285F4]";
                return (
                    <div key={idx} className="h-1 flex-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 relative shadow-sm transition-colors">
                        <div className={`absolute inset-0 transition-all duration-300 ${bgClass} ${isActive ? 'animate-pulse' : ''}`} />
                    </div>
                );
            })}
        </div>
      );
  };

  const getQuestionTypeIcon = () => {
      switch(currentQuestion.type) {
          case QuestionType.ORDERING: return <ArrowUpDown size={10} />;
          case QuestionType.MATCHING: return <Split size={10} />;
          case QuestionType.MULTIPLE_CHOICE: return <ListChecks size={10} />;
          case QuestionType.TRUE_FALSE: return <CheckSquare size={10} />;
          case QuestionType.FLASHCARD: return <GalleryVerticalEnd size={10} />;
          case QuestionType.FILL_IN_THE_BLANK: return <MinusSquare size={10} />;
          default: return <Type size={10} />;
      }
  };

  // Explain It Back Modal
  if (showExplainModal) {
      return (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="max-w-md w-full space-y-4">
                  <div className="text-center">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                          <BrainCircuit size={24} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Explain It Back</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Prove you understand the concept by explaining it in your own words.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Concept to Explain</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{currentQuestion.question}</p>
                      {/* We don't show the answer yet, the goal is to explain the concept implied */}
                  </div>

                  {!explanationFeedback ? (
                      <>
                        <textarea
                            value={userExplanation}
                            onChange={(e) => setUserExplanation(e.target.value)}
                            className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Type your explanation here..."
                        />
                        <Button fullWidth onClick={submitExplanation} isLoading={isCheckingExplanation} disabled={!userExplanation.trim()} icon={<Send size={16}/>}>
                            Check Understanding
                        </Button>
                        <button onClick={() => setShowExplainModal(false)} className="w-full text-center text-xs text-slate-400 font-bold hover:text-slate-600 mt-2">
                            Skip for now
                        </button>
                      </>
                  ) : (
                      <div className="space-y-4 animate-in slide-up">
                          <div className={`p-4 rounded-xl border ${explanationFeedback.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                              <div className="flex items-center gap-2 mb-1 font-bold">
                                  {explanationFeedback.isCorrect ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
                                  <span>{explanationFeedback.isCorrect ? 'Great Explanation!' : 'Not quite there yet'}</span>
                              </div>
                              <p className="text-sm opacity-90">{explanationFeedback.feedback}</p>
                          </div>
                          <Button fullWidth onClick={() => setShowExplainModal(false)}>
                              Continue
                          </Button>
                      </div>
                  )}
              </div>
          </div>
      )
  }

  return (
    <div className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300 ${isBossMode ? (bossAttackAnim ? 'bg-red-50 dark:bg-red-900/10' : '') : ''}`}>
      
      {/* Compact Top Bar */}
      <div className="bg-white dark:bg-slate-800 px-4 py-2 shadow-sm z-20 border-b border-slate-100 dark:border-slate-700 transition-colors shrink-0">
        <div className="flex justify-between items-center">
             <button onClick={onExit} className="p-1 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1 group">
                <X size={16} className="group-hover:scale-110 transition-transform"/>
                <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
             </button>
             
             {timeLimit > 0 && !isFlashcard && !isBossMode ? (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold tabular-nums transition-colors text-[10px] ${
                    timeLeft <= 10 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                    <Clock size={12} />
                    <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
             ) : (
                !isBossMode && (
                    <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100">
                        Q <span className="text-[#4285F4] text-sm">{currentIndex + 1}</span> <span className="text-slate-300 dark:text-slate-600">/</span> {questions.length}
                    </div>
                )
             )}
        </div>
        {renderProgressBar()}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28">
        
        {!isFlashcard && (
            <div className={`bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all duration-300 ${isShaking ? 'animate-shake ring-2 ring-red-200 dark:ring-red-900' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide
                    ${currentQuestion.type === 'MULTIPLE_CHOICE' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                    currentQuestion.type === 'TRUE_FALSE' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                    currentQuestion.type === 'MATCHING' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    currentQuestion.type === 'ORDERING' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                    currentQuestion.type === 'FILL_IN_THE_BLANK' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' :
                    'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}
                `}>
                    {getQuestionTypeIcon()}
                    {currentQuestion.type.replace(/_/g, ' ')}
                </span>
            </div>
            
            <div className="max-h-[35vh] overflow-y-auto custom-scrollbar pr-1">
                <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {isFillInBlank ? (
                        <>
                            {currentQuestion.question.split('______').map((part, i, arr) => (
                                <React.Fragment key={i}>
                                    {part}
                                    {i < arr.length - 1 && (
                                        <span className="mx-1 inline-block w-16 border-b-2 border-dashed border-slate-400 dark:border-slate-500 relative top-1"></span>
                                    )}
                                </React.Fragment>
                            ))}
                        </>
                    ) : (
                        currentQuestion.question
                    )}
                </h2>
            </div>
            </div>
        )}

        <div className="space-y-2 h-full">

            {isFlashcard && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] perspective-1000">
                     <div 
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className={`relative w-full max-w-sm aspect-[4/5] md:aspect-[4/3] transition-all duration-500 transform-style-3d cursor-pointer group ${isCardFlipped ? 'rotate-y-180' : ''}`}
                     >
                         <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center">
                             <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Front</span>
                             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentQuestion.question}</h2>
                             <div className="absolute bottom-4 flex flex-col items-center gap-1 text-slate-400 text-xs animate-pulse">
                                 <RotateCw size={16} />
                                 <span className="text-[9px] font-bold uppercase">Tap Flip</span>
                             </div>
                         </div>
                         <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 dark:bg-indigo-900 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center text-white">
                             <span className="absolute top-4 left-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Back</span>
                             <h2 className="text-xl font-bold mb-3">{currentQuestion.correctAnswer}</h2>
                             {currentQuestion.explanation && (
                                 <p className="text-xs text-indigo-100 leading-relaxed opacity-90">{currentQuestion.explanation}</p>
                             )}
                         </div>
                     </div>
                </div>
            )}
            
            {isOrdering && (
                <div className="space-y-2 mt-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-1">
                        {isAnswerRevealed ? 'Correct Order' : 'Drag to reorder'}
                    </p>
                    <div className="space-y-2">
                    {orderingState.map((itemObj, idx) => {
                        const itemText = itemObj.text;
                        const isCorrectPos = isAnswerRevealed && itemText === currentQuestion.orderingItems?.[idx];
                        const isDragging = draggedIdx === idx;
                        
                        let borderColor = "border-slate-200 dark:border-slate-700";
                        let bgColor = "bg-white dark:bg-slate-800";
                        let rankColor = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
                        
                        if (isAnswerRevealed) {
                            borderColor = isCorrectPos ? "border-[#34A853]" : "border-[#EA4335]";
                            bgColor = isCorrectPos ? "bg-[#34A853]/5 dark:bg-[#34A853]/10" : "bg-[#EA4335]/5 dark:bg-[#EA4335]/10";
                            rankColor = isCorrectPos ? "bg-[#34A853] text-white" : "bg-[#EA4335] text-white";
                        } else if (isDragging) {
                            bgColor = "bg-blue-50 dark:bg-blue-900/20";
                            borderColor = "border-[#4285F4] border-dashed";
                        }

                        return (
                            <div 
                                key={itemObj.id} 
                                draggable={!isAnswerRevealed}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`relative flex items-center gap-2 p-2 md:p-3 rounded-xl border transition-all shadow-sm ${borderColor} ${bgColor} 
                                ${!isAnswerRevealed ? 'cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600' : ''}
                                ${isDragging ? 'opacity-50 scale-[0.98]' : ''}
                                `}
                            >
                                {!isAnswerRevealed && (
                                    <div className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing p-1 -ml-1">
                                        <GripVertical size={16} />
                                    </div>
                                )}
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${rankColor}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 font-bold text-slate-700 dark:text-slate-200 text-xs md:text-sm leading-snug select-none">
                                    {itemText}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}

            {isMatching && currentQuestion.matchingPairs && (
                <div className="mt-2">
                     <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-2">Tap left item, then match</p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="space-y-2">
                            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase mb-0.5">Terms</span>
                            {currentQuestion.matchingPairs.map((pair, idx) => {
                                const isSelected = matchingState.selectedLeft === pair.left;
                                const isMatched = !!matchingState.matches[pair.left];
                                let containerClass = "relative w-full p-2 md:p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between min-h-[48px] group ";
                                if (isAnswerRevealed) {
                                    const matchedRight = matchingState.matches[pair.left];
                                    const isCorrect = matchedRight === pair.right;
                                    containerClass += isCorrect ? "border-[#34A853] bg-[#34A853]/10 text-[#34A853]" : "border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]";
                                } else {
                                    if (isSelected) {
                                        containerClass += "border-[#4285F4] bg-[#4285F4] text-white shadow-md scale-105 z-10";
                                    } else if (isMatched) {
                                        containerClass += "border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
                                    } else {
                                        containerClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#4285F4]/50 hover:bg-slate-50";
                                    }
                                }
                                return (
                                    <button key={idx} onClick={() => handleMatchClick('left', pair.left)} disabled={isAnswerRevealed} className={containerClass}>
                                        <span className="text-[10px] md:text-xs font-bold leading-tight">{pair.left}</span>
                                        {isMatched && !isSelected && <Link2 size={12} className="opacity-50 shrink-0 ml-1"/>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-2">
                            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase mb-0.5">Definitions</span>
                            {matchingState.shuffledRight.map((item, idx) => {
                                 const matchedLeftKey = Object.keys(matchingState.matches).find(k => matchingState.matches[k] === item);
                                 const isMatched = !!matchedLeftKey;
                                 let containerClass = "relative w-full p-2 md:p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between min-h-[48px] ";
                                 if (isAnswerRevealed) {
                                     if (matchedLeftKey) {
                                         const correctRight = currentQuestion.matchingPairs?.find(p => p.left === matchedLeftKey)?.right;
                                         const isCorrect = correctRight === item;
                                         containerClass += isCorrect ? "border-[#34A853] bg-[#34A853]/10 text-[#34A853]" : "border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]";
                                     } else {
                                         containerClass += "border-slate-200 dark:border-slate-700 opacity-40 grayscale";
                                     }
                                 } else {
                                     if (isMatched) {
                                        containerClass += "border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
                                     } else {
                                        const isValidTarget = matchingState.selectedLeft; 
                                        containerClass += isValidTarget 
                                            ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#4285F4]" 
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white";
                                     }
                                 }
                                 return (
                                    <button key={idx} onClick={() => handleMatchClick('right', item)} disabled={isAnswerRevealed} className={containerClass}>
                                        <span className="text-[10px] md:text-xs font-medium leading-tight">{item}</span>
                                        {isMatched && <Link2 size={12} className="opacity-50 shrink-0 ml-1"/>}
                                    </button>
                                 )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {(!isShortAnswer && !isFillInBlank && !isOrdering && !isMatching && !isFlashcard) && (
                currentQuestion.options.map((option, idx) => {
                    let baseClasses = "w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden transform active:scale-[0.98]";
                    let stateClasses = "bg-white dark:bg-slate-800 border-transparent shadow-sm hover:border-[#4285F4]/30 hover:bg-[#4285F4]/5 dark:hover:bg-[#4285F4]/10 hover:shadow-md";
                    let textClasses = "text-slate-600 dark:text-slate-300 font-medium text-sm relative z-10";

                    if (isAnswerRevealed) {
                        const isCorrectOption = isOptionMatch(option, currentQuestion.correctAnswer);
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
                        stateClasses = "bg-[#4285F4] border-[#4285F4] shadow-md shadow-blue-200 dark:shadow-blue-900/50 scale-[1.01] active:scale-[0.99]";
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
                            {isAnswerRevealed && isOptionMatch(option, currentQuestion.correctAnswer) && (
                                <CheckCircle2 size={16} className="text-[#34A853] animate-in scale-in" />
                            )}
                            {isAnswerRevealed && option === selectedOption && !isOptionMatch(option, currentQuestion.correctAnswer) && (
                                <XCircle size={16} className="text-[#EA4335] animate-in scale-in" />
                            )}
                        </button>
                    )
                })
            )}

            {(isShortAnswer || isFillInBlank) && (
                <div className="relative">
                    <textarea 
                        className={`w-full p-3 rounded-xl border-2 bg-white dark:bg-slate-800 outline-none h-24 resize-none text-sm transition-all duration-200
                            ${isAnswerRevealed 
                                ? (isCurrentCorrect ? 'border-[#34A853] text-[#34A853] bg-[#34A853]/5' : 'border-[#EA4335] text-[#EA4335] bg-[#EA4335]/5') 
                                : 'border-dashed border-slate-300 dark:border-slate-600 focus:border-[#4285F4] text-slate-700 dark:text-slate-200 focus:shadow-md focus:bg-slate-50'}
                        `}
                        placeholder={isFillInBlank ? "Type the missing word..." : "Type answer..."}
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={isAnswerRevealed}
                    />
                    {isAnswerRevealed && (
                        <div className="absolute top-2 right-2 animate-in scale-in">
                            {isCurrentCorrect ? <CheckCircle2 className="text-[#34A853]" size={16}/> : <XCircle className="text-[#EA4335]" size={16}/>}
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="mt-3 space-y-2">
            {!isAnswerRevealed && !showHint && !isTimeUp && !isFlashcard && (
                <button 
                    onClick={handleHint}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#FBBC05] bg-[#FBBC05]/10 px-3 py-1.5 rounded-lg hover:bg-[#FBBC05]/20 transition-all mx-auto hover:scale-105 active:scale-95"
                >
                    <Lightbulb size={12} />
                    <span>{hintLevel === 0 ? "Hint" : "Another Hint"}</span>
                </button>
            )}

            {showHint && !isAnswerRevealed && (
                <div className="bg-[#FBBC05]/10 border border-[#FBBC05]/20 p-2.5 rounded-xl animate-in fade-in slide-up">
                    <div className="flex items-start gap-2">
                        <Lightbulb size={14} className="text-[#f9ab00] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#b47a00] dark:text-[#f9ab00] font-medium leading-relaxed">
                            {hintLevel === 1 ? (currentQuestion.hint.split('.')[0] + "...") : currentQuestion.hint}
                        </p>
                    </div>
                </div>
            )}

            {isAnswerRevealed && !isFlashcard && (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl shadow-sm animate-in slide-up overflow-hidden relative">
                    <div className={`flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wide
                        ${isCurrentCorrect ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                        {isCurrentCorrect ? 'Correct!' : (isTimeUp ? 'Time Up!' : 'Incorrect')}
                    </div>
                    
                    {isTimeUp && !isCurrentCorrect && (
                         <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg mb-2 text-[10px] font-semibold">
                             <AlertTriangle size={12} />
                             <span>Out of time!</span>
                         </div>
                    )}

                    {(!isCurrentCorrect || isShortAnswer || isFillInBlank) && !isOrdering && !isMatching && (
                         <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5 block">Answer</span>
                            <p className="text-slate-800 dark:text-slate-100 font-bold text-xs bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                {currentQuestion.correctAnswer}
                            </p>
                         </div>
                    )}
                    
                    {isOrdering && !isCurrentCorrect && (
                         <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                             <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5 block">Correct Sequence</span>
                             <ol className="list-decimal list-inside text-[10px] text-slate-800 dark:text-slate-100 font-semibold space-y-0.5 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg">
                                {currentQuestion.orderingItems?.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                             </ol>
                         </div>
                    )}

                    {isMatching && !isCurrentCorrect && (
                        <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5 block">Correct Matches</span>
                        <div className="grid grid-cols-1 gap-1">
                            {currentQuestion.matchingPairs?.map((pair, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pair.left}</span>
                                    <ArrowRight size={10} className="text-slate-400 mx-2" />
                                    <span className="font-bold text-[#34A853]">{pair.right}</span>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-1">
                         <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-xs">
                            {explanationMode === 'standard' ? <BookOpen size={12} className="text-[#4285F4]"/> : <Baby size={12} className="text-[#4285F4]"/>}
                            Explanation
                         </h4>
                         {currentQuestion.simpleExplanation && (
                             <button 
                                onClick={() => setExplanationMode(prev => prev === 'standard' ? 'simple' : 'standard')}
                                className="text-[8px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
                             >
                                 Switch to {explanationMode === 'standard' ? 'Simple' : 'Academic'}
                             </button>
                         )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed transition-opacity duration-300 mb-2">
                        {explanationMode === 'standard' ? currentQuestion.explanation : currentQuestion.simpleExplanation}
                    </p>

                    {currentQuestion.searchQuery && (
                         <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuestion.searchQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-bold text-[10px]"
                         >
                             <Youtube size={12} />
                             <span>Watch Clip</span>
                         </a>
                    )}
                </div>
            )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 z-30 transition-colors">
            {!isAnswerRevealed ? (
                <>
                {isFlashcard ? (
                    <div className={`flex gap-3 transition-opacity duration-300 ${isCardFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <Button fullWidth size="md" onClick={() => handleCheckAnswer(false, false)} className="bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 shadow-md shadow-red-200 dark:shadow-red-900/20 text-sm">Review</Button>
                        <Button fullWidth size="md" onClick={() => handleCheckAnswer(false, true)} className="bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 shadow-md shadow-green-200 dark:shadow-green-900/20 text-sm">Got it</Button>
                    </div>
                ) : (
                    <Button 
                        fullWidth 
                        size="md" 
                        onClick={() => handleCheckAnswer(false)}
                        disabled={
                            (!isShortAnswer && !isFillInBlank && !isMatching && !isOrdering && !selectedOption) || 
                            ((isShortAnswer || isFillInBlank) && !textAnswer.trim()) || 
                            (isMatching && Object.keys(matchingState.matches).length === 0)
                        }
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 rounded-xl py-2.5 shadow-md shadow-slate-200 dark:shadow-none transform active:scale-[0.98] transition-all text-sm"
                    >
                        {isBossMode ? 'Attack Boss' : 'Check Answer'}
                    </Button>
                )}
                </>
            ) : (
                <Button 
                    fullWidth 
                    size="md" 
                    onClick={handleNext}
                    className="bg-[#4285F4] text-white hover:bg-[#3367d6] rounded-xl py-2.5 shadow-md shadow-blue-200 dark:shadow-blue-900/50 transform active:scale-[0.98] transition-all text-sm"
                    icon={currentIndex === questions.length - 1 ? (isBossMode && playerHealth <= 0 ? <Skull size={16}/> : undefined) : <ArrowRight size={16} />}
                >
                    {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};
