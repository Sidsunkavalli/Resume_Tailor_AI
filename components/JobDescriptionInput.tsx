
import React from 'react';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">2. Job Description</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">Paste the full job description you're applying for.</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste job description here..."
        className="w-full h-48 p-4 text-sm border border-slate-300 dark:border-slate-600 rounded-lg resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
      />
    </div>
  );
};
