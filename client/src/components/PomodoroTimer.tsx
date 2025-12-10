
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, X, Tomato, Settings } from './Icons';

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSetTime = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setCustomMinutes(minutes.toString());
    setIsRunning(false);
  };

  const handleCustomSubmit = () => {
      const mins = parseInt(customMinutes);
      if(!isNaN(mins) && mins > 0) {
          handleSetTime(mins);
      }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    handleSetTime(parseInt(customMinutes) || 25);
  };

  // Minimized View
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 shadow-lg transition-all duration-300 flex items-center gap-2 border border-red-100 animate-in slide-in-from-left-5 ${isRunning ? 'bg-red-500 text-white pl-4 pr-6 py-3 rounded-full hover:bg-red-600 shadow-red-200' : 'bg-white text-red-500 p-3 rounded-full hover:bg-red-50 hover:scale-110'}`}
        title="Pomodoro Timer"
      >
        <Tomato className={isRunning ? "w-6 h-6 animate-pulse" : "w-8 h-8"} />
        {isRunning && <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>}
      </button>
    );
  }

  // Expanded View
  return (
     <div className="fixed bottom-6 left-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-in slide-in-from-bottom-5 slide-in-from-left-5">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-red-600 font-bold">
                <Tomato className="w-6 h-6" />
                <span>Pomodoro Focus</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5"/></button>
        </div>

        <div className="text-center mb-8">
            <div className="text-6xl font-mono font-bold text-gray-800 mb-2 tracking-tighter tabular-nums">{formatTime(timeLeft)}</div>
            <div className="flex justify-center gap-4">
                <button onClick={toggleTimer} className={`p-4 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center ${isRunning ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                    {isRunning ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current"/>}
                </button>
                <button onClick={resetTimer} className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shadow-sm">
                    <RefreshCw className="w-6 h-6"/>
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Presets Rápidos</span>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleSetTime(25)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${timeLeft === 25*60 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>25m Foco</button>
                    <button onClick={() => handleSetTime(5)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${timeLeft === 5*60 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>5m Pausa</button>
                    <button onClick={() => handleSetTime(15)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${timeLeft === 15*60 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>15m Longa</button>
                </div>
            </div>

            <div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tempo Personalizado (min)</span>
                 <div className="flex gap-2">
                     <input 
                        type="number" 
                        value={customMinutes} 
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Minutos"
                     />
                     <button onClick={handleCustomSubmit} className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-900">Definir</button>
                 </div>
            </div>
        </div>
     </div>
  );
};
