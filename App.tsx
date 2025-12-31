import React from 'react';
import IsoDinoGame from './components/IsoDinoGame';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center p-2 md:p-4">
      <div className="relative w-full h-full md:h-auto md:max-w-5xl md:aspect-video bg-white rounded-xl shadow-2xl overflow-hidden ring-2 md:ring-4 ring-slate-800">
        <IsoDinoGame />
      </div>
    </div>
  );
};

export default App;
