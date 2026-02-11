import React from 'react';

export const Header: React.FC = () => {
  // Simple SVG data URI for a clean, fast loading logo
  const logoSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%23008751'/%3E%3Cpath d='M336 256h-80v128h-64V128h144c53.02 0 96 42.98 96 96s-42.98 96-96 96z' fill='%23ffffff'/%3E%3C/svg%3E`;

  return (
    <header className="sticky top-0 z-50 bg-naija-surface/95 backdrop-blur-md border-b border-gray-800 py-6 shadow-lg transition-all duration-300">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoSrc} 
            alt="Pidgix Logo" 
            className="w-10 h-10 rounded-lg shadow-md border-2 border-white/10"
          />
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