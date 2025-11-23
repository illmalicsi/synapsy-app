
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Settings, Moon, Sun, LogOut, User, ChevronDown, History } from 'lucide-react';

interface ProfileDropdownProps {
  user: UserProfile;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  user, 
  isDarkMode, 
  toggleTheme, 
  onOpenSettings,
  onOpenHistory,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white dark:bg-slate-800 pl-1 pr-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
      >
        <img 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.avatarSeed}`} 
            alt={user.name} 
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-600" 
        />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-200 max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown size={14} className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in slide-up z-50">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
          </div>
          
          <div className="p-2">
            <button 
              onClick={() => {
                onOpenHistory();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold"
            >
              <History size={18} />
              <span>History</span>
            </button>

            <button 
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold"
            >
              <User size={18} />
              <span>Edit Profile</span>
            </button>
            
            <button 
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold"
            >
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                <span>Dark Mode</span>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </button>
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-semibold"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
