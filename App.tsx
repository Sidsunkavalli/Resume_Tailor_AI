import React, { useState, useCallback, useEffect } from 'react';
import { ResumeInput } from './components/ResumeInput';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { SuggestionsDisplay } from './components/SuggestionsDisplay';
import { getResumeSuggestions } from './services/geminiService';
import { trackAnalysis } from './services/trackingService';
import { AnalysisSession, ChatMessage } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { LogoIcon } from './components/icons/LogoIcon';
import { ScreeningPrep } from './components/ScreeningPrep';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { ActiveAnalysisHeader } from './components/ActiveAnalysisHeader';
import { Sidebar } from './components/Sidebar';
import { MenuIcon } from './components/icons/MenuIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import { useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { UserProfile } from './components/UserProfile';

const defaultChatHistory: ChatMessage[] = [{ role: 'model', content: "I'm ready to help! Ask me any other questions you think a recruiter might ask, and I'll help you practice your answers." }];

export default function App(): React.ReactElement {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
      setDarkMode(prev => {
          const newMode = !prev;
          if (newMode) {
              document.documentElement.classList.add('dark');
              localStorage.setItem('theme', 'dark');
          } else {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('theme', 'light');
          }
          return newMode;
      });
  };

  // Load from localStorage on initial render
  useEffect(() => {
    let loadedSessions: AnalysisSession[] = [];
    try {
      const storedSessions = window.localStorage.getItem('resumeTailorSessions');
      if (storedSessions) {
        loadedSessions = JSON.parse(storedSessions);
      }
    } catch (error) {
      console.error("Failed to parse sessions from localStorage", error);
    }
    
    setSessions(loadedSessions);

    if (loadedSessions.length > 0) {
      setActiveSessionId(loadedSessions[0].timestamp);
    } else {
      // Use a timeout to avoid rapid state changes in one render cycle
      setTimeout(() => handleNewAnalysis(true), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        window.localStorage.setItem('resumeTailorSessions', JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage", error);
      }
    }
  }, [sessions]);
  
  const activeSession = sessions.find(s => s.timestamp === activeSessionId);

  const handleUpdateActiveSession = useCallback((update: Partial<AnalysisSession>) => {
    if (!activeSessionId) return;
    setSessions(prev => 
      prev.map(s => s.timestamp === activeSessionId ? { ...s, ...update } : s)
    );
  }, [activeSessionId]);
  
  const handleNewAnalysis = useCallback((isInitial: boolean = false) => {
    const newSession: AnalysisSession = {
      name: `New Analysis - ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      resumeText: !isInitial && activeSession ? activeSession.resumeText : null, 
      resumeFileName: !isInitial && activeSession ? activeSession.resumeFileName : null,
      jobDescription: '',
      suggestions: null,
      screeningPrep: null,
      chatHistory: [...defaultChatHistory],
      coverLetter: null,
      isLoadingSuggestions: false,
      isLoadingPrep: false,
      error: null,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.timestamp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSession]);

  const handleSelectSession = useCallback((sessionId: number) => {
    setActiveSessionId(sessionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const handleDeleteSession = useCallback((sessionId: number) => {
    setSessions(prev => {
        const newSessions = prev.filter(s => s.timestamp !== sessionId);
        if (activeSessionId === sessionId) {
            if (newSessions.length > 0) {
                setActiveSessionId(newSessions[0].timestamp);
            } else {
                const newSession: AnalysisSession = { 
                    name: `New Analysis - ${new Date().toLocaleDateString()}`, 
                    timestamp: Date.now(), 
                    resumeText: null, 
                    resumeFileName: null, 
                    jobDescription: '', 
                    suggestions: null, 
                    screeningPrep: null,
                    chatHistory: [...defaultChatHistory],
                    coverLetter: null,
                    isLoadingSuggestions: false,
                    isLoadingPrep: false,
                    error: null,
                };
                setActiveSessionId(newSession.timestamp);
                return [newSession];
            }
        }
        return newSessions;
    });
  }, [activeSessionId]);

  const handleSubmit = async () => {
    if (!activeSession || !activeSession.resumeText || !activeSession.jobDescription) {
      handleUpdateActiveSession({ error: 'Please upload a resume and paste a job description.' });
      return;
    }

    handleUpdateActiveSession({ isLoadingSuggestions: true, error: null, suggestions: null });

    try {
      const result = await getResumeSuggestions(activeSession.resumeText, activeSession.jobDescription);
      
      console.log("Analysis complete. Syncing data to cloud...");

      // Track analysis data asynchronously (fire and forget)
      trackAnalysis(
        activeSession.resumeText, 
        activeSession.jobDescription, 
        result, 
        activeSession.resumeFileName,
        user?.email || null,
        user?.uid || null
      ).catch(err => console.warn("Tracking error:", err));

      handleUpdateActiveSession({ suggestions: result, name: result.suggestedSessionName, isLoadingSuggestions: false });
    } catch (e) {
      console.error(e);
      handleUpdateActiveSession({ error: 'An error occurred while generating suggestions. Please try again.', isLoadingSuggestions: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isButtonDisabled = activeSession?.isLoadingSuggestions || !activeSession?.resumeText || !activeSession?.jobDescription || isParsing;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
       <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onNewAnalysis={handleNewAnalysis}
      />
      <main className="container mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    aria-label="Open analyses menu"
                >
                    <MenuIcon className="w-6 h-6 text-slate-700 dark:text-slate-300"/>
                </button>
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-10 h-10 md:w-12 md:h-12" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            Resume Tailor <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                            Get instant, AI-powered feedback to align your resume with any job description.
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleDarkMode}
                    className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
                    aria-label="Toggle Dark Mode"
                >
                    {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
                <UserProfile />
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-6 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
             <ActiveAnalysisHeader session={activeSession} onRename={(name) => handleUpdateActiveSession({ name })} />
            <ResumeInput 
              onResumeUpload={(text, name) => handleUpdateActiveSession({ resumeText: text, resumeFileName: name, suggestions: null, screeningPrep: null, chatHistory: [...defaultChatHistory], coverLetter: null })}
              fileName={activeSession?.resumeFileName || null}
              onRemove={() => handleUpdateActiveSession({ resumeText: null, resumeFileName: null })}
              isParsing={isParsing}
              setIsParsing={setIsParsing}
            />
            <JobDescriptionInput value={activeSession?.jobDescription || ''} onChange={(value) => handleUpdateActiveSession({ jobDescription: value })} />
            <button
              onClick={handleSubmit}
              disabled={!!isButtonDisabled}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white rounded-xl transition-all duration-300 shadow-md ${
                isButtonDisabled
                  ? 'bg-indigo-300 dark:bg-indigo-900/50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500'
              }`}
            >
              <SparklesIcon />
              {activeSession?.isLoadingSuggestions ? 'Analyzing...' : isParsing ? 'Parsing Resume...' : 'Tailor My Resume'}
            </button>
          </div>

          <div className="lg:sticky top-8">
            <SuggestionsDisplay
              key={activeSessionId} // force re-render on session change
              suggestions={activeSession?.suggestions || null}
              isLoading={!!activeSession?.isLoadingSuggestions}
              error={activeSession?.error || null}
              onNewAnalysis={handleNewAnalysis}
            />
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {activeSession && (
            <>
                <ScreeningPrep
                key={`prep-${activeSessionId}`}
                session={activeSession}
                onUpdateSession={handleUpdateActiveSession}
                />
                
                <CoverLetterGenerator
                key={`cover-${activeSessionId}`}
                session={activeSession}
                onUpdateSession={handleUpdateActiveSession}
                />
            </>
          )}
        </div>

      </main>
      <footer className="text-center py-8 mt-8 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-500">Powered by Gemini API</p>
      </footer>
    </div>
  );
}
