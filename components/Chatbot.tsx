
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisSession } from '../types';
import { getChatbotAnswer } from '../services/geminiService';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChatbotProps {
  session: AnalysisSession;
  onUpdateSession: (update: Partial<AnalysisSession>) => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ session, onUpdateSession }) => {
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const conversation = session.chatHistory || [];

  useEffect(() => {
    // Scroll to the bottom of the chat container when a new message is added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: userInput.trim() };
    const newHistory = [...conversation, userMessage];
    
    // Optimistically update the UI with the user's message
    onUpdateSession({ chatHistory: newHistory });
    setUserInput('');
    setIsSending(true);

    try {
      const modelResponse = await getChatbotAnswer(
        session.resumeText || '',
        session.jobDescription,
        session.suggestions,
        newHistory,
        userInput.trim()
      );
      const modelMessage: ChatMessage = { role: 'model', content: modelResponse };
      onUpdateSession({ chatHistory: [...newHistory, modelMessage] });
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
      onUpdateSession({ chatHistory: [...newHistory, errorMessage] });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors duration-300">
        <div className="flex items-center gap-3 mb-4">
             <SparklesIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400"/>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Practice Follow-up Questions</h4>
        </div>
      
      <div ref={chatContainerRef} className="h-96 overflow-y-auto pr-2 space-y-4 mb-4">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
            <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-grow p-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !userInput.trim()}
          className="p-3 font-semibold text-white bg-indigo-600 rounded-lg transition-all duration-300 enabled:hover:bg-indigo-700 enabled:active:scale-95 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5"/>
        </button>
      </form>
    </div>
  );
};
