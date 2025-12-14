
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, X, Tomato } from './Icons';

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
    // Posicionamento responsivo inicial
    const isMobile = window.innerWidth < 768;
    setPosition({ 
        x: isMobile ? window.innerWidth - 80 : 30, 
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

  // --- LÓGICA DE ARRASTAR UNIFICADA (MOUSE + TOUCH) ---

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

    // Limites de segurança para não sumir da tela
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
    // e.preventDefault(); // Comentado para permitir foco no input se necessário, mas cuidado com drag
    if ((e.target as HTMLElement).tagName === 'INPUT') return; // Permite selecionar texto do input
    
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

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
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

  const containerStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      touchAction: 'none', // Impede scroll da página ao arrastar no mobile
  };

  // --- VISÃO MINIMIZADA (PÍLULA DE VIDRO) ---
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
        // Liquid Glass Style Minimized
        className={`
            z-[100] cursor-move select-none 
            flex items-center gap-3 px-3 py-2 rounded-full
            backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]
            transition-all duration-300 hover:scale-105 active:scale-95 animate-in fade-in zoom-in
            ${isRunning 
                ? 'bg-red-500/20 shadow-red-500/20 border-red-300/50' 
                : 'bg-white/30 hover:bg-white/50'
            }
        `}
        title="Clique para abrir o Pomodoro"
      >
        <div className="relative flex items-center justify-center">
            {isRunning && (
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
            )}
            <Tomato className={`w-10 h-10 drop-shadow-md ${isRunning ? 'animate-pulse' : ''}`} />
        </div>
        
        {/* Mostra o tempo mesmo minimizado */}
        <span className={`font-mono font-bold text-xl drop-shadow-sm tabular-nums ${isRunning ? 'text-red-600' : 'text-slate-700'}`}>
            {formatTime(timeLeft)}
        </span>
      </div>
    );
  }

  // --- VISÃO EXPANDIDA (JANELA DE VIDRO LÍQUIDO) ---
  return (
     <div 
        style={containerStyle}
        // Liquid Glass Style Expanded
        className="
            z-[100] w-80 p-6 rounded-3xl
            bg-white/60 backdrop-blur-2xl 
            border border-white/60 
            shadow-[0_20px_50px_rgba(0,0,0,0.15)]
            ring-1 ring-white/80
            animate-in fade-in zoom-in-95
            flex flex-col gap-6
        "
     >
        {/* Header - Drag Area */}
        <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex justify-between items-center cursor-move select-none"
        >
            <div className="flex items-center gap-2 pointer-events-none">
                <Tomato className="w-6 h-6 drop-shadow-md" />
                <span className="text-sm font-bold text-slate-700 tracking-wide uppercase opacity-80">Focus Mode</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="text-slate-500 hover:text-red-500 p-1.5 rounded-full hover:bg-white/50 transition-colors"
            >
                <X className="w-5 h-5"/>
            </button>
        </div>

        {/* Timer Big Display */}
        <div className="text-center select-none">
            <div className="text-7xl font-mono font-bold text-slate-800 tracking-tighter tabular-nums drop-shadow-sm mb-6">
                {formatTime(timeLeft)}
            </div>
            
            {/* Liquid Action Buttons */}
            <div className="flex justify-center gap-6">
                <button 
                    onClick={toggleTimer} 
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center 
                        shadow-lg transition-all active:scale-90 border-2 
                        ${isRunning 
                            ? 'bg-amber-400/90 border-amber-300 text-white hover:bg-amber-500 shadow-amber-500/40' 
                            : 'bg-red-500/90 border-red-400 text-white hover:bg-red-600 shadow-red-500/40'
                        }
                    `}
                >
                    {isRunning ? <Pause className="w-8 h-8 fill-current"/> : <Play className="w-8 h-8 fill-current ml-1"/>}
                </button>
                
                <button 
                    onClick={resetTimer} 
                    className="
                        w-16 h-16 rounded-full flex items-center justify-center 
                        bg-white/50 border-2 border-white/60 text-slate-600 
                        hover:bg-white hover:text-indigo-600 hover:border-indigo-200
                        shadow-lg transition-all active:scale-90 backdrop-blur-sm
                    "
                >
                    <RefreshCw className="w-7 h-7"/>
                </button>
            </div>
        </div>

        {/* Settings Area */}
        <div className="bg-white/40 rounded-2xl p-4 border border-white/50 shadow-inner">
            <div className="mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">Presets</span>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { m: 25, label: '25m', color: 'red' },
                        { m: 5, label: '5m', color: 'green' },
                        { m: 15, label: '15m', color: 'blue' }
                    ].map((preset) => (
                        <button 
                            key={preset.m}
                            onClick={() => handleSetTime(preset.m)} 
                            className={`
                                py-2 rounded-xl text-xs font-bold transition-all border shadow-sm backdrop-blur-sm
                                ${timeLeft === preset.m * 60 
                                    ? `bg-${preset.color}-500/90 text-white border-${preset.color}-400` 
                                    : 'bg-white/60 text-slate-600 border-white hover:bg-white'
                                }
                            `}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Input Layout Fixed */}
            <div className="flex gap-2 items-center bg-white/60 p-1.5 rounded-xl border border-white shadow-sm">
                 <input 
                    type="number" 
                    value={customMinutes} 
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()} // Permite foco sem arrastar
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none px-2 py-1 text-sm outline-none text-slate-800 font-bold text-center placeholder:text-slate-400 min-w-0"
                    placeholder="Min"
                 />
                 <button 
                    onClick={handleCustomSubmit} 
                    className="shrink-0 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-md"
                 >
                    Definir
                 </button>
            </div>
        </div>
     </div>
  );
};
