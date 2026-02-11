import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-naija-surface border-b border-gray-800 py-6 shadow-lg">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-naija-green rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">
            PX
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Pidgix</h1>
            <p className="text-gray-400 text-xs opacity-90">Authentic Naija Translator</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="bg-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-700 text-gray-300">
            Na We Dey Run Am
          </span>
        </div>
      </div>
    </header>
  );
};