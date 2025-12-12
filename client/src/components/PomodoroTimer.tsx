
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, X, Tomato, Settings } from './Icons';

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  
  // Position state
  const [position, setPosition] = useState({ x: 30, y: 600 });
  
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // RESPONSIVE INITIAL POSITIONING
    // Mobile: Top Right (below header) to avoid keyboard and chat widget
    // Desktop: Bottom Left
    const isMobile = window.innerWidth < 768;
    setPosition({ 
        x: isMobile ? window.innerWidth - 70 : 30, 
        y: isMobile ? 80 : window.innerHeight - 100 
    });
  }, []);

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

  // --- UNIFIED DRAG LOGIC (MOUSE + TOUCH) ---

  const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
    isDragging.current = true;
    hasMoved.current = false;
    
    const rect = target.getBoundingClientRect();
    dragOffset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    hasMoved.current = true;
    
    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;

    // Safety Bounds
    const maxX = window.innerWidth - (isOpen ? 300 : 60); 
    const maxY = window.innerHeight - 60;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); // Prevent text selection
    handleStart(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
      handleEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
  };

  // Touch Handlers (Mobile/Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
      handleEnd();
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      if (!hasMoved.current) {
          setIsOpen(true);
      }
  };

  // Styles for fixed position with glassmorphism
  const containerStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      touchAction: 'none', // CRITICAL for mobile drag: prevents scrolling the page
  };

  // Minimized View
  if (!isOpen) {
    return (
      <div 
        ref={timerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={containerStyle}
        className={`z-50 shadow-xl backdrop-blur-xl border flex items-center gap-2 cursor-move select-none animate-in fade-in zoom-in active:scale-95 transition-transform ${isRunning ? 'bg-red-500/80 border-red-400 text-white pl-3 pr-4 py-2 md:pl-4 md:pr-6 md:py-3 rounded-full shadow-red-500/30' : 'bg-white/40 border-white/50 text-red-500 p-2 md:p-3 rounded-full hover:bg-white/60'}`}
        title="Pomodoro Timer (Arraste para mover)"
      >
        <Tomato className={isRunning ? "w-5 h-5 md:w-6 md:h-6 animate-pulse" : "w-6 h-6 md:w-8 md:h-8"} />
        {isRunning && <span className="font-mono font-bold text-base md:text-lg pointer-events-none drop-shadow-md">{formatTime(timeLeft)}</span>}
      </div>
    );
  }

  // Expanded View
  return (
     <div 
        style={containerStyle}
        className="z-50 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-4 md:p-6 w-72 md:w-80 animate-in fade-in zoom-in-95 ring-1 ring-black/5"
     >
        {/* Header (Drag Handle) */}
        <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex justify-between items-center mb-4 md:mb-6 cursor-move -mx-4 -mt-4 p-4 md:-mx-6 md:-mt-6 md:p-6 pb-2 rounded-t-3xl bg-gradient-to-b from-white/40 to-transparent select-none"
        >
            <div className="flex items-center gap-2 text-red-600 font-bold pointer-events-none">
                <Tomato className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm" />
                <span className="text-sm md:text-base drop-shadow-sm">Pomodoro Focus</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-white/50 cursor-pointer transition-colors"
            >
                <X className="w-5 h-5"/>
            </button>
        </div>

        <div className="text-center mb-6 md:mb-8 select-none">
            <div className="text-6xl font-mono font-bold text-gray-800 mb-4 tracking-tighter tabular-nums drop-shadow-sm">{formatTime(timeLeft)}</div>
            <div className="flex justify-center gap-6">
                <button onClick={toggleTimer} className={`w-14 h-14 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center border-2 border-white/20 ${isRunning ? 'bg-amber-400 text-white hover:bg-amber-500 shadow-amber-200' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'}`}>
                    {isRunning ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current ml-1"/>}
                </button>
                <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-white/70 text-gray-600 hover:bg-white border-2 border-white/50 transition-all shadow-md flex items-center justify-center">
                    <RefreshCw className="w-6 h-6"/>
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block select-none px-1">Presets de Vidro</span>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleSetTime(25)} className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${timeLeft === 25*60 ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white/40 text-gray-600 border-white/60 hover:bg-white/80'}`}>25m</button>
                    <button onClick={() => handleSetTime(5)} className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${timeLeft === 5*60 ? 'bg-green-500 text-white border-green-500 shadow-md' : 'bg-white/40 text-gray-600 border-white/60 hover:bg-white/80'}`}>5m</button>
                    <button onClick={() => handleSetTime(15)} className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${timeLeft === 15*60 ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white/40 text-gray-600 border-white/60 hover:bg-white/80'}`}>15m</button>
                </div>
            </div>

            <div>
                 <div className="flex gap-2 bg-white/40 p-1 rounded-xl border border-white/50">
                     <input 
                        type="number" 
                        value={customMinutes} 
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-none rounded-lg px-3 py-1 text-sm outline-none text-gray-700 font-bold text-center"
                        placeholder="Min"
                     />
                     <button onClick={handleCustomSubmit} className="px-4 py-2 bg-gray-800/90 text-white text-xs md:text-sm font-bold rounded-lg hover:bg-black transition-colors shadow-sm">Definir</button>
                 </div>
            </div>
        </div>
     </div>
  );
};
