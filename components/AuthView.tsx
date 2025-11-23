
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
    <div className="min-h-full flex flex-col items-center justify-center p-4 animate-in fade-in">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="w-14 h-14 bg-gradient-to-tr from-[#4285F4] to-[#3367d6] rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/20 flex items-center justify-center text-white mb-3 transform hover:scale-105 transition-all duration-300">
           <BrainCircuit size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center mb-1">
          Synapsy
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs text-xs leading-relaxed">
          The next-gen AI study companion.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-hidden relative z-10">
         
         {/* Tabs */}
         <div className="flex p-1.5 bg-slate-50 dark:bg-slate-900/50">
           <button 
             onClick={() => setIsLogin(true)}
             className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
           >
             Sign In
           </button>
           <button 
             onClick={() => setIsLogin(false)}
             className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
           >
             Sign Up
           </button>
         </div>

         <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
               {!isLogin && (
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                   <div className="relative group">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="Enter your full name"
                      />
                   </div>
                 </div>
               )}

               <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email</label>
                   <div className="relative group">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="Enter your email address"
                      />
                   </div>
               </div>

               <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Password</label>
                   <div className="relative group">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                      <input 
                        type="password" 
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] outline-none transition-all"
                        placeholder="Enter your password"
                      />
                   </div>
               </div>

               <Button 
                 fullWidth 
                 type="submit" 
                 isLoading={isLoading}
                 className="mt-4 py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30 font-bold text-sm transition-transform active:scale-[0.98]"
                 icon={!isLoading ? (isLogin ? <ArrowRight size={16} /> : <Sparkles size={16} />) : undefined}
               >
                 {isLogin ? 'Get Started' : 'Join Synapsy'}
               </Button>
            </form>
         </div>
      </div>
      
      {/* Footer info */}
      <div className="mt-6 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium opacity-80 mb-1">
          by Ivan Louie Malicsi
        </p>
        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            Secure • Private • AI-Powered
        </p>
      </div>

    </div>
  );
};
