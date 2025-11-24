import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { LogoIcon } from './icons/LogoIcon';

export const LoginScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for OAuth operations. Please add it to the Firebase Console.");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800 text-center">
        <div className="flex justify-center mb-6">
          <LogoIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Resume Tailor <span className="text-indigo-600 dark:text-indigo-400">AI</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Sign in to track your applications, tailor your resume, and prepare for interviews with AI.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
        
        <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};