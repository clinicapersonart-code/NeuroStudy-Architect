
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, X, Tomato } from './Icons';

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Position state
  const [position, setPosition] = useState({ x: 30, y: 600 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

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
    setIsRunning(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    handleSetTime(25);
  };

  // --- LÓGICA DE ARRASTAR OTIMIZADA ---

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = {
        x: clientX - position.x,
        y: clientY - position.y
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    hasMoved.current = true;
    
    let newX = clientX - dragStartPos.current.x;
    let newY = clientY - dragStartPos.current.y;

    // Limites de segurança
    const maxX = window.innerWidth - 60; 
    const maxY = window.innerHeight - 60;
    
    setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mouse Handlers
  useEffect(() => {
      const onMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              e.preventDefault(); // Evita seleção de texto durante arraste
              handleDragMove(e.clientX, e.clientY);
          }
      };
      const onMouseUp = () => {
          if (isDragging) handleDragEnd();
      };

      if (isDragging) {
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
      }

      return () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
      };
  }, [isDragging]);

  const onMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Apenas botão esquerdo
      handleDragStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
       const touch = e.touches[0];
       handleDragMove(touch.clientX, touch.clientY);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      if (!hasMoved.current) {
          setIsOpen(true);
      }
  };

  const containerStyle: React.CSSProperties = {
      position: 'fixed',
      left: 0,
      top: 0,
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`, // Aceleração de Hardware
      touchAction: 'none',
      willChange: 'transform', // Dica para o navegador otimizar
  };

  // --- VISÃO MINIMIZADA (SÓ ÍCONE ou ÍCONE + TEMPO) ---
  if (!isOpen) {
    return (
      <div 
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleDragEnd}
        onClick={handleClick}
        style={containerStyle}
        // ULTRA GLASS STYLE - MINIMIZED
        className={`
            z-[100] cursor-move select-none 
            flex items-center justify-center
            backdrop-blur-md border shadow-[0_4px_20px_rgba(0,0,0,0.1)]
            transition-all duration-200 active:scale-95
            ${isRunning 
                ? 'bg-white/10 border-white/20 rounded-full px-3 py-1 gap-3' 
                : 'bg-white/5 hover:bg-white/20 border-white/10 rounded-full w-14 h-14'
            }
        `}
        title="Pomodoro Focus"
      >
        <div className="relative flex items-center justify-center">
            {isRunning && (
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            )}
            <Tomato className={`drop-shadow-sm ${isRunning ? 'w-8 h-8 animate-pulse' : 'w-10 h-10 hover:scale-110 transition-transform'}`} />
        </div>
        
        {/* Só mostra o tempo se estiver rodando */}
        {isRunning && (
            <span className="font-mono font-bold text-lg text-slate-700/80 drop-shadow-sm tabular-nums">
                {formatTime(timeLeft)}
            </span>
        )}
      </div>
    );
  }

  // --- VISÃO EXPANDIDA (JANELA GHOST GLASS) ---
  return (
     <div 
        style={containerStyle}
        // ULTRA GLASS STYLE - EXPANDED
        className="
            z-[100] w-72 p-5 rounded-3xl
            bg-white/20 backdrop-blur-xl 
            border border-white/30 
            shadow-[0_8px_32px_rgba(0,0,0,0.1)]
            flex flex-col gap-5
            animate-in zoom-in-95 duration-200
        "
     >
        {/* Header */}
        <div 
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleDragEnd}
            className="flex justify-between items-center cursor-move select-none"
        >
            <div className="flex items-center gap-2 pointer-events-none opacity-70">
                <Tomato className="w-5 h-5" />
                <span className="text-xs font-bold text-slate-800 tracking-widest uppercase">Focus</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                className="text-slate-600/70 hover:text-red-500 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
                <X className="w-5 h-5"/>
            </button>
        </div>

        {/* Timer Display */}
        <div className="text-center select-none">
            <div className="text-6xl font-mono font-bold text-slate-800/90 tracking-tighter tabular-nums drop-shadow-sm mb-6">
                {formatTime(timeLeft)}
            </div>
            
            {/* Liquid Action Buttons */}
            <div className="flex justify-center gap-6">
                <button 
                    onClick={toggleTimer} 
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center 
                        shadow-lg transition-all active:scale-90 border
                        backdrop-blur-sm
                        ${isRunning 
                            ? 'bg-amber-400/80 border-amber-300/50 text-white hover:bg-amber-500/90' 
                            : 'bg-red-500/80 border-red-400/50 text-white hover:bg-red-600/90'
                        }
                    `}
                >
                    {isRunning ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current ml-1"/>}
                </button>
                
                <button 
                    onClick={resetTimer} 
                    className="
                        w-14 h-14 rounded-full flex items-center justify-center 
                        bg-white/30 border border-white/40 text-slate-700 
                        hover:bg-white/50 hover:text-indigo-600
                        shadow-lg transition-all active:scale-90 backdrop-blur-sm
                    "
                >
                    <RefreshCw className="w-6 h-6"/>
                </button>
            </div>
        </div>

        {/* Presets Grid - Sem Input Manual */}
        <div className="grid grid-cols-3 gap-2">
            {[
                { m: 25, label: '25m', color: 'bg-red-500/10 hover:bg-red-500/20 text-red-800 border-red-200/30' },
                { m: 5, label: '5m', color: 'bg-green-500/10 hover:bg-green-500/20 text-green-800 border-green-200/30' },
                { m: 15, label: '15m', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border-blue-200/30' }
            ].map((preset) => (
                <button 
                    key={preset.m}
                    onClick={() => handleSetTime(preset.m)} 
                    className={`
                        py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-sm
                        ${timeLeft === preset.m * 60 
                            ? 'bg-slate-800/80 text-white border-transparent shadow-md' 
                            : `${preset.color} border`
                        }
                    `}
                >
                    {preset.label}
                </button>
            ))}
        </div>
     </div>
  );
};
