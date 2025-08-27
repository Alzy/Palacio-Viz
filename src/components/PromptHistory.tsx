'use client';

import React from 'react';

interface PromptHistoryProps {
  /** Array of unique prompts */
  prompts: string[];
  /** Callback when left arrow is clicked */
  onSelectLeft: (prompt: string) => void;
  /** Callback when right arrow is clicked */
  onSelectRight: (prompt: string) => void;
  /** Custom class name */
  className?: string;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({
  prompts,
  onSelectLeft,
  onSelectRight,
  className = '',
}) => {
  if (prompts.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p className="text-sm">No prompts yet. Start typing to build your history!</p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <h3 className="text-sm font-medium text-foreground mb-3 flex-shrink-0">Prompt History</h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {prompts.map((prompt, index) => (
          <div
            key={`${prompt}-${index}`}
            className="flex items-center space-x-2 group"
          >
            {/* Left Arrow */}
            <button
              onClick={() => onSelectLeft(prompt)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-500/90 text-white flex items-center justify-center transition-colors_
 opacity-70 group-hover:opacity-100"
              title="Use as left prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Prompt Badge */}
            <div className="flex-1 min-w-0">
              <div className="bg-muted hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors">
                <p className="text-sm text-foreground truncate" title={prompt}>
                  {prompt}
                </p>
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => onSelectRight(prompt)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 hover:bg-red-500/90 text-white flex items-center justify-center transition-colors opacity-70 group-hover:opacity-100"
              title="Use as right prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptHistory;