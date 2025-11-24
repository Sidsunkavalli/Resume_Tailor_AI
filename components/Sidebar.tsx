
import React from 'react';
import { AnalysisSession } from '../types';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AnalysisSession[];
  activeSessionId: number | null;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  onNewAnalysis: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, sessions, activeSessionId, onSelect, onDelete, onNewAnalysis }) => {
  const handleNewAnalysisClick = () => {
    onNewAnalysis();
    onClose();
  }

  const handleSelectClick = (sessionId: number) => {
    onSelect(sessionId);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
      {/* Sidebar Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My Analyses"
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <HistoryIcon className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Analyses</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <XIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          {/* New Analysis Button */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
             <button 
                onClick={handleNewAnalysisClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all dark:bg-indigo-600 dark:hover:bg-indigo-500"
                aria-label="Start new analysis"
            >
                <PlusIcon className="w-4 h-4" /> New Analysis
            </button>
          </div>

          {/* List */}
          <div className="flex-grow p-4 overflow-y-auto">
            {sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li key={session.timestamp}>
                    <button
                      onClick={() => handleSelectClick(session.timestamp)}
                      className={`w-full p-3 rounded-md flex items-center justify-between gap-2 text-left transition-colors ${
                        session.timestamp === activeSessionId 
                            ? 'bg-indigo-100 dark:bg-indigo-900/40' 
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {(session.isLoadingSuggestions || session.isLoadingPrep) && (
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold truncate ${
                            session.timestamp === activeSessionId 
                                ? 'text-indigo-800 dark:text-indigo-300' 
                                : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {session.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(session.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(session.timestamp); }}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                        aria-label={`Delete analysis ${session.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                <p>Your previous analyses will appear here.</p>
                <p className="mt-1">Click "New Analysis" to start!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
