import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../services/firebase';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 ml-4">
      {user.photoURL ? (
        <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
            {user.email?.[0].toUpperCase() || 'U'}
        </div>
      )}
      <div className="hidden md:block text-sm text-right">
        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-none">{user.displayName || 'User'}</p>
        <button 
            onClick={signOut}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-1"
        >
            Sign Out
        </button>
      </div>
       <button 
            onClick={signOut}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-red-500"
            title="Sign Out"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
    </div>
  );
};