
import React, { useState } from 'react';
import { TailoredSuggestions, SuggestionItem, ReplacementItem, ScoreBreakdown } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { CopyIcon } from './icons/CopyIcon';

interface SuggestionsDisplayProps {
  suggestions: TailoredSuggestions | null;
  isLoading: boolean;
  error: string | null;
  onNewAnalysis: () => void;
}

const BreakdownItem: React.FC<{ label: string; score: number }> = ({ label, score }) => (
    <div className="mb-3 last:mb-0">
        <div className="flex justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <span className={`text-sm font-bold ${score >= 80 ? 'text-green-600 dark:text-green-400' : score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                {score}/100
            </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
            ></div>
        </div>
    </div>
);

const ScoreDisplay: React.FC<{ initial: number; projected: number; breakdown?: ScoreBreakdown }> = ({ initial, projected, breakdown }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const initialOffset = circumference - (initial / 100) * circumference;
    const projectedOffset = circumference - (projected / 100) * circumference;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Score Gauge */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Resume Match Score</h3>
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                        {/* Background track */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            className="stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="12"
                        />
                        {/* Projected score arc */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            className="stroke-emerald-200 dark:stroke-emerald-800/50"
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={projectedOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                        {/* Initial score arc */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            className="stroke-emerald-500 dark:stroke-emerald-500"
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={initialOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">{initial}<span className="text-2xl">%</span></span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Current</span>
                    </div>
                </div>
                <div className="mt-4 text-center">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Potential Score: <span className="font-bold text-lg">{projected}%</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">after applying suggestions</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            {breakdown && (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Score Analysis</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 italic leading-relaxed flex-grow">
                        "{breakdown.explanation}"
                    </p>
                    <div className="space-y-4">
                        <BreakdownItem label="Keyword Match" score={breakdown.keywordMatch} />
                        <BreakdownItem label="Experience Level" score={breakdown.experienceLevel} />
                        <BreakdownItem label="Skills Depth" score={breakdown.skillsMatch} />
                        <BreakdownItem label="Industry Knowledge" score={breakdown.industryKnowledge} />
                    </div>
                </div>
            )}
        </div>
    );
};

const SuggestionCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, children, icon, color }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border-t-4 ${color} border-slate-200 dark:border-slate-800 transition-colors duration-300`}>
        <div className="p-5">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            </div>
            <div className="mt-4 space-y-4 text-slate-700 dark:text-slate-300">
                {children}
            </div>
        </div>
    </div>
);

const AdditionItemDisplay: React.FC<{ item: SuggestionItem }> = ({ item }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(item.suggestion).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group transition-colors duration-300">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-1">{item.section}</p>
                    <p className="text-slate-800 dark:text-slate-200">{item.suggestion}</p>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                    aria-label="Copy suggestion"
                >
                    {copied ? (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 w-12">Copied!</span>
                    ) : (
                        <CopyIcon className="w-4 h-4" />
                    )}
                </button>
            </div>
            <p className="text-indigo-700 dark:text-indigo-400 mt-2 text-xs italic">
                <span className="font-bold">Reason:</span> {item.reason}
            </p>
        </div>
    );
};


const RemovalItemDisplay: React.FC<{ item: SuggestionItem }> = ({ item }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-1">{item.section}</p>
        <p className="text-red-600 dark:text-red-400 line-through">{item.suggestion}</p>
        <p className="text-indigo-700 dark:text-indigo-400 mt-2 text-xs italic">
            <span className="font-bold">Reason:</span> {item.reason}
        </p>
    </div>
);

const ReplacementItemDisplay: React.FC<{ item: ReplacementItem }> = ({ item }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(item.replacement).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
    };
    
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group transition-colors duration-300">
            <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-2">{item.section}</p>
            <div className="text-sm">
                <p className="text-red-600 dark:text-red-400 line-through">
                    <span className="font-bold">Original:</span> {item.original}
                </p>
                <div className="flex justify-between items-start gap-2 mt-1">
                    <p className="text-green-700 dark:text-green-400 flex-1">
                        <span className="font-bold">Replacement:</span> {item.replacement}
                    </p>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                        aria-label="Copy replacement text"
                    >
                        {copied ? (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 w-12">Copied!</span>
                        ) : (
                            <CopyIcon className="w-4 h-4"/>
                        )}
                    </button>
                </div>
                <p className="text-indigo-700 dark:text-indigo-400 mt-2 text-xs italic">
                    <span className="font-bold">Reason:</span> {item.reason}
                </p>
            </div>
        </div>
    );
};


export const SuggestionsDisplay: React.FC<SuggestionsDisplayProps> = ({ 
    suggestions, 
    isLoading, 
    error, 
    onNewAnalysis,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg h-full min-h-[500px] transition-colors duration-300">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Generating tailored suggestions...</p>
        <p className="text-slate-500 dark:text-slate-400">This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg h-full min-h-[500px] transition-colors duration-300">
        <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg h-full min-h-[500px] border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="text-indigo-500 dark:text-indigo-400">
          <SparklesIcon className="w-16 h-16" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Your Suggestions Will Appear Here</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-sm">
          Upload your resume and a job description, then click "Tailor My Resume" to get started.
        </p>
      </div>
    );
  }

  const { additions, removals, replacements, initialMatchScore, projectedMatchScore, scoreBreakdown } = suggestions;
  const hasSuggestions = additions.length > 0 || removals.length > 0 || replacements.length > 0;

  return (
    <div className="space-y-6">
      <ScoreDisplay initial={initialMatchScore} projected={projectedMatchScore} breakdown={scoreBreakdown} />
      
      {!hasSuggestions && (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg text-center border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Looks Good!</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">We couldn't find any specific changes to recommend. Your resume seems well-aligned with the job description.</p>
        </div>
      )}
      {replacements.length > 0 && (
        <SuggestionCard title="Replacements" color="border-t-yellow-500" icon={<div className="text-yellow-500">🔄</div>}>
          {replacements.map((item, index) => <ReplacementItemDisplay key={index} item={item} />)}
        </SuggestionCard>
      )}
      {additions.length > 0 && (
        <SuggestionCard title="Additions" color="border-t-green-500" icon={<div className="text-green-500">➕</div>}>
          {additions.map((item, index) => <AdditionItemDisplay key={index} item={item} />)}
        </SuggestionCard>
      )}
      {removals.length > 0 && (
        <SuggestionCard title="Removals" color="border-t-red-500" icon={<div className="text-red-500">➖</div>}>
          {removals.map((item, index) => <RemovalItemDisplay key={index} item={item} />)}
        </SuggestionCard>
      )}
    </div>
  );
};
