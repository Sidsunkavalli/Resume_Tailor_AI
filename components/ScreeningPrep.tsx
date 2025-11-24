
import React, { useState, useEffect } from 'react';
import { ScreeningPrepItem, AnalysisSession } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { Chatbot } from './Chatbot';
import { getScreeningPrep } from '../services/geminiService';

interface ScreeningPrepProps {
  session: AnalysisSession;
  onUpdateSession: (update: Partial<AnalysisSession>) => void;
}

const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) {
    return text;
  }
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        keywords.some(kw => new RegExp(kw, 'i').test(part)) ? (
          <strong key={i} className="font-bold text-indigo-600 dark:text-indigo-400">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
};

const QAItem: React.FC<{ item: ScreeningPrepItem; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full text-left p-4 focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">{highlightKeywords(item.question, item.keywords)}</h4>
          <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.answer}</p>
        </div>
      )}
    </div>
  );
};

export const ScreeningPrep: React.FC<ScreeningPrepProps> = ({ session, onUpdateSession }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Reset accordion when session changes
  useEffect(() => {
    setActiveIndex(null);
  }, [session.timestamp]);

  const handleGenerate = async () => {
    if (!session.resumeText || !session.jobDescription) return;

    onUpdateSession({ isLoadingPrep: true, error: null });
    setActiveIndex(null);

    try {
      const result = await getScreeningPrep(session.resumeText, session.jobDescription, session.suggestions);
      onUpdateSession({ screeningPrep: result, isLoadingPrep: false });
    } catch (e) {
      console.error(e);
      onUpdateSession({ error: 'An error occurred while generating the screening prep. Please try again.', isLoadingPrep: false });
    }
  };

  const handleItemClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const isButtonDisabled = session.isLoadingPrep || !session.resumeText || !session.jobDescription;

  const renderContent = () => {
    if (session.isLoadingPrep) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Generating interview questions...</p>
        </div>
      );
    }

    if (session.error && !session.suggestions) { // only show prep-related error if suggestions are not being shown
      return (
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{session.error}</p>
          <button
            onClick={handleGenerate}
            className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (session.screeningPrep) {
      return (
        <>
            <div className="border-t border-slate-200 dark:border-slate-700">
            {session.screeningPrep.map((item, index) => (
                <QAItem
                key={index}
                item={item}
                isOpen={activeIndex === index}
                onClick={() => handleItemClick(index)}
                />
            ))}
            </div>
            {session.resumeText && (
                <Chatbot 
                    session={session}
                    onUpdateSession={onUpdateSession}
                />
            )}
        </>
      );
    }

    return null; // Initial state before button is clicked
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="p-5">
        <div className="flex items-center gap-3">
            <div className="text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                <SparklesIcon className="w-6 h-6"/>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Prepare for Screening</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
            Generate common recruiter questions and AI-powered answers based on your resume and the job description.
        </p>
        {!session.screeningPrep && !session.isLoadingPrep && (
            <button
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold text-white rounded-lg transition-all duration-300 ${
                  isButtonDisabled
                    ? 'bg-indigo-300 dark:bg-indigo-900/50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                }`}
            >
                <SparklesIcon className="w-5 h-5"/>
                {session.isLoadingPrep ? 'Generating...' : 'Generate Interview Prep'}
            </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};
