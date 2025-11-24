
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisSession } from '../types';
import { EditIcon } from './icons/EditIcon';

interface ActiveAnalysisHeaderProps {
  session: AnalysisSession | undefined;
  onRename: (newName: string) => void;
}

export const ActiveAnalysisHeader: React.FC<ActiveAnalysisHeaderProps> = ({ session, onRename }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(session?.name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(session?.name || '');
    setIsRenaming(false); // Reset renaming state when session changes
  }, [session]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== session?.name) {
      onRename(name.trim());
    } else {
      setName(session?.name || ''); // Reset if empty or unchanged
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setName(session?.name || '');
      setIsRenaming(false);
    }
  };

  if (!session) return null;

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-4 transition-colors duration-300">
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="w-full font-bold text-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate" title={session.name}>
          {session.name}
        </h2>
      )}
      {!isRenaming && (
        <button
          onClick={() => setIsRenaming(true)}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          aria-label="Rename analysis"
        >
          <EditIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      )}
    </div>
  );
};
