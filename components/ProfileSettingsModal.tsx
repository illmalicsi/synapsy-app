import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, RefreshCcw, Save } from 'lucide-react';
import { Button } from './Button';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser
}) => {
  const [name, setName] = useState(user.name);
  const [avatarSeed, setAvatarSeed] = useState(user.avatarSeed);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatarSeed(user.avatarSeed);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleSave = () => {
    onUpdateUser({ ...user, name, avatarSeed });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 animate-in scale-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
            {/* Avatar Preview */}
            <div className="relative group mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-600 shadow-inner">
                    <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <button 
                    onClick={handleRandomizeAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform active:scale-90"
                    title="Randomize Avatar"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>

            {/* Name Input */}
            <div className="w-full space-y-2 mb-6">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Display Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter your name"
                />
            </div>

            <Button fullWidth onClick={handleSave} icon={<Save size={18} />}>
                Save Changes
            </Button>
        </div>

      </div>
    </div>
  );
};