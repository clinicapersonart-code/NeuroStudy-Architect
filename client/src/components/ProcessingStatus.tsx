
import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Activity, Search, FileText, Layers, CheckCircle } from './Icons';

interface ProcessingStatusProps {
  step: 'idle' | 'analyzing' | 'transcribing' | 'generating' | 'slides' | 'quiz' | 'flashcards' | 'diagram' | 'complete';
  type?: 'guide' | 'slides' | 'quiz' | 'flashcards';
}

const TIPS = [
  "💡 Dica: O cérebro aprende melhor em intervalos curtos (Técnica Pomodoro).",
  "🧠 Sabia? Dormir bem é essencial para consolidar a memória de longo prazo.",
  "💧 Hidrate-se: A desidratação reduz a atenção e a memória de trabalho.",
  "🗣️ Active Recall: Tente explicar o conteúdo em voz alta para aprender mais rápido.",
  "📝 Escrever à mão ativa áreas do cérebro diferentes da digitação.",
  "🔄 Repetição Espaçada: Revise este conteúdo amanhã, depois em 3 dias, depois em uma semana."
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ step, type = 'guide' }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Random tip on mount
    setTipIndex(Math.floor(Math.random() * TIPS.length));

    // Simulated progress based on step
    let targetProgress = 0;
    let speed = 100;

    switch (step) {
      case 'analyzing': targetProgress = 30; speed = 200; break;
      case 'transcribing': targetProgress = 40; speed = 300; break;
      case 'generating': targetProgress = 85; speed = 150; break;
      case 'slides': targetProgress = 90; speed = 100; break;
      case 'quiz': targetProgress = 90; speed = 100; break;
      case 'flashcards': targetProgress = 90; speed = 100; break;
      case 'complete': targetProgress = 100; speed = 50; break;
      default: targetProgress = 10;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) return prev;
        // Add some randomness to make it feel natural
        return Math.min(prev + Math.random() * 2, targetProgress);
      });
    }, speed);

    return () => clearInterval(interval);
  }, [step]);

  const getStepInfo = () => {
    switch (step) {
      case 'analyzing': return { icon: <Search className="w-8 h-8 text-indigo-500 animate-bounce" />, title: "Analisando Estrutura...", desc: "Identificando conceitos chave e padrões." };
      case 'transcribing': return { icon: <FileText className="w-8 h-8 text-blue-500 animate-pulse" />, title: "Transcrevendo Mídia...", desc: "Convertendo áudio/vídeo em texto processável." };
      case 'generating': return { icon: <Brain className="w-8 h-8 text-purple-500 animate-pulse" />, title: "Sintetizando Conhecimento...", desc: "Aplicando filtros de Pareto (80/20) e criando checkpoints." };
      case 'slides': return { icon: <Activity className="w-8 h-8 text-orange-500 animate-spin" />, title: "Diagramando Slides...", desc: "Estruturando apresentação visual e notas do orador." };
      case 'quiz': return { icon: <CheckCircle className="w-8 h-8 text-green-500 animate-bounce" />, title: "Formulando Questões...", desc: "Criando desafios de recuperação ativa." };
      case 'flashcards': return { icon: <Layers className="w-8 h-8 text-pink-500 animate-pulse" />, title: "Criando Flashcards...", desc: "Gerando pares de memorização frente/verso." };
      default: return { icon: <Sparkles className="w-8 h-8 text-gray-400" />, title: "Processando...", desc: "Aguarde um momento." };
    }
  };

  const info = getStepInfo();

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-300">
      
      {/* Icon Wrapper */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-indigo-100 rounded-full scale-150 opacity-20 animate-ping"></div>
        <div className="bg-indigo-50 p-4 rounded-full relative z-10">
          {info.icon}
        </div>
      </div>

      {/* Text Info */}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{info.title}</h3>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">{info.desc}</p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden relative">
        <div 
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out animate-shimmer bg-[length:200%_100%]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Neuro Tip */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 w-full text-center">
        <p className="text-xs text-indigo-800 font-medium italic">
          {TIPS[tipIndex]}
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
