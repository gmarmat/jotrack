"use client";

import { useState } from "react";

interface WordcloudProps {
  words: string[];
  onWordClick?: (word: string) => void;
  title?: string;
}

/**
 * Simple wordcloud visualization
 * Displays words with size based on frequency/importance
 * Click to add to manual tags
 */
export default function Wordcloud({ words, onWordClick, title = "Keywords" }: WordcloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  if (!words || words.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-4">
        No keywords available
      </div>
    );
  }

  // Simple size calculation (top words bigger)
  const getSize = (index: number) => {
    if (index < 3) return "text-lg";
    if (index < 8) return "text-base";
    if (index < 15) return "text-sm";
    return "text-xs";
  };

  const getOpacity = (index: number) => {
    if (index < 5) return "opacity-100";
    if (index < 10) return "opacity-90";
    if (index < 15) return "opacity-80";
    return "opacity-70";
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      {title && (
        <div className="text-xs font-medium text-gray-700 mb-3">{title}</div>
      )}
      
      <div 
        className="flex flex-wrap gap-2 justify-center items-center min-h-[100px]"
        data-testid="wordcloud"
      >
        {words.map((word, index) => (
          <button
            key={`${word}-${index}`}
            onClick={() => onWordClick?.(word)}
            onMouseEnter={() => setHoveredWord(word)}
            onMouseLeave={() => setHoveredWord(null)}
            className={`
              ${getSize(index)}
              ${getOpacity(index)}
              px-2 py-1 rounded-md font-medium
              transition-all duration-200
              ${hoveredWord === word 
                ? "bg-blue-600 text-white scale-110 shadow-md" 
                : "bg-white text-blue-700 hover:bg-blue-100"
              }
            `}
            title={`Click to add "${word}" to your tags`}
            data-testid={`wordcloud-word-${word}`}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-600 mt-3 text-center">
        💡 Click any word to add it to your manual tags
      </div>
    </div>
  );
}

