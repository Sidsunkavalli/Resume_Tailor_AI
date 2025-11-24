
import React from 'react';
import { AnalysisSession } from '../types';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

interface AnalysesListProps {
  sessions: AnalysisSession[];
  activeSessionId: number | null;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  onNewAnalysis: () => void;
}

export const AnalysesList: React.FC<AnalysesListProps> = ({ sessions, activeSessionId, onSelect, onDelete, onNewAnalysis }) => {
  return (
    <div className="border border-slate-200 rounded-lg flex flex-col">
      {/* Header is always visible and at the top of the component */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
              <HistoryIcon />
              <h2 className="text-xl font-bold text-slate-800">My Analyses</h2>
          </div>
          <button 
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 active:scale-95 transition-all"
              aria-label="Start new analysis"
          >
              <PlusIcon className="w-4 h-4" /> New
          </button>
      </div>

      {/* Always-visible, scrollable list */}
      <div className="p-4 max-h-60 overflow-y-auto">
        {sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.timestamp}>
                <button
                    onClick={() => onSelect(session.timestamp)}
                    className={`w-full p-3 rounded-md flex items-center justify-between gap-2 text-left transition-colors ${
                        session.timestamp === activeSessionId ? 'bg-indigo-100' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {(session.isLoadingSuggestions || session.isLoadingPrep) && (
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-bold truncate ${
                            session.timestamp === activeSessionId ? 'text-indigo-800' : 'text-slate-800'
                        }`}>
                            {session.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {new Date(session.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(session.timestamp); }}
                        className="p-2 rounded-full hover:bg-red-100 opacity-50 hover:opacity-100 transition-opacity"
                        aria-label={`Delete analysis ${session.name}`}
                    >
                        <TrashIcon />
                    </button>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500">
            <p>Your analyses will appear here.</p>
            <p className="mt-1">Click "New" to start your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};