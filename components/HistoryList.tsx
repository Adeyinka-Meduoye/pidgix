import React from 'react';
import { TranslationResult } from '../types';

interface HistoryListProps {
  history: TranslationResult[];
  onClear: () => void;
  onSelect: (item: TranslationResult) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear, onSelect }) => {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-naija-surface rounded-xl shadow-sm border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-300 font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Yarns
        </h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-900/20"
        >
          Clear History
        </button>
      </div>
      
      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {history.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item)}
            className="group p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                item.tone === 'street' ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'
              }`}>
                {item.tone}
              </span>
              <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-400 text-sm line-clamp-1 mb-1 font-medium">{item.original}</p>
            <p className="text-naija-green text-sm line-clamp-2 font-semibold group-hover:text-green-400">{item.translated}</p>
          </div>
        ))}
      </div>
    </div>
  );
};