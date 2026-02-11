import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Translator } from './components/Translator';
import { HistoryList } from './components/HistoryList';
import { TranslationResult, ToneType } from './types';

const HISTORY_KEY = 'pidgix-history'; // Changed key to reset/start fresh for rebrand
const TONE_KEY = 'pidgix-tone';

const App: React.FC = () => {
  const [history, setHistory] = useState<TranslationResult[]>([]);
  // Initialize tone from local storage or default to 'street'
  const [tone, setTone] = useState<ToneType>(() => {
    return (localStorage.getItem(TONE_KEY) as ToneType) || 'street';
  });

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Save tone whenever it changes
  useEffect(() => {
    localStorage.setItem(TONE_KEY, tone);
  }, [tone]);

  const handleNewTranslation = (result: TranslationResult) => {
    setHistory(prev => [result, ...prev].slice(0, 50)); // Keep last 50
  };

  const handleClearHistory = () => {
    if (window.confirm("You wan clear everything?")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY); // Explicitly remove for robustness
    }
  };

  const handleHistorySelect = (item: TranslationResult) => {
    navigator.clipboard.writeText(item.translated);
    // Simple toast-like alert
    const el = document.createElement('div');
    el.innerText = `Copied: "${item.translated.substring(0, 30)}..."`;
    el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-naija-green text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm animate-bounce';
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 2000);
  };

  return (
    <div className="min-h-screen bg-naija-darker flex flex-col font-sans text-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              English <span className="text-gray-600">→</span> <span className="text-naija-green">Pidgin</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Translate your grammar to street credibility instantly. Whether you need am for <span className="font-semibold text-gray-200">Street</span> or <span className="font-semibold text-gray-200">Office</span>, Pidgix dey for you.
            </p>
          </div>

          <Translator 
            onNewTranslation={handleNewTranslation} 
            tone={tone}
            onToneChange={setTone}
          />
          
          <HistoryList 
            history={history} 
            onClear={handleClearHistory} 
            onSelect={handleHistorySelect}
          />
        </div>
      </main>

      <footer className="bg-naija-surface border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">Made with ❤️ and plenty 🌶️ pepper.</p>
          <p className="mt-2 text-xs text-gray-500">AI translations may vary. Always double check before you use am for serious matter.</p>
          <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col items-center">
             <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Developed by</span>
             <span className="text-sm font-bold text-naija-green mt-1">MEDUS TECHNOLOGIES</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;