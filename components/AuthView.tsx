import React, { useState } from 'react';
import { Button } from './Button';
import { BrainCircuit, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  error?: string | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
    } catch (e) {
      // Error is handled by parent passing 'error' prop usually
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 animate-in fade-in">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-10 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-[#4285F4] to-[#3367d6] rounded-[24px] shadow-xl shadow-blue-200 dark:shadow-blue-900/20 flex items-center justify-center text-white mb-6 transform hover:scale-105 transition-all duration-300">
           <BrainCircuit size={40} strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight text-center mb-2">
          Synapsy
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs text-sm leading-relaxed">
          The next-gen AI study companion. <br/>Master any topic with dynamic drills.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-hidden relative z-10">
         
         {/* Tabs */}
         <div className="flex p-2 bg-slate-50 dark:bg-slate-900/50">
           <button 
             onClick={() => setIsLogin(true)}
             className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
           >
             Sign In
           </button>
           <button 
             onClick={() => setIsLogin(false)}
             className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
           >
             Sign Up
           </button>
         </div>

         <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               {!isLogin && (
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                   <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="Louie"
                      />
                   </div>
                 </div>
               )}

               <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email</label>
                   <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="hello@synapsy.ai"
                      />
                   </div>
               </div>

               <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Password</label>
                   <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="password" 
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="••••••••"
                      />
                   </div>
               </div>

               <Button 
                 fullWidth 
                 type="submit" 
                 isLoading={isLoading}
                 className="mt-6 py-4 rounded-2xl bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 font-bold text-lg transition-transform active:scale-[0.98]"
                 icon={!isLoading ? (isLogin ? <ArrowRight size={20} /> : <Sparkles size={18} />) : undefined}
               >
                 {isLogin ? 'Get Started' : 'Join Synapsy'}
               </Button>
            </form>
         </div>
      </div>
      
      {/* Footer info */}
      <p className="mt-8 text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
        Secure • Private • AI-Powered
      </p>

    </div>
  );
};