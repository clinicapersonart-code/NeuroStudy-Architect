
import React, { useState } from 'react';
import { X, Calendar, Clock, BrainCircuit } from './Icons';

interface ReviewSchedulerModalProps {
  onClose: () => void;
  onSchedule: (date: number) => void;
  studyTitle: string;
}

export const ReviewSchedulerModal: React.FC<ReviewSchedulerModalProps> = ({ onClose, onSchedule, studyTitle }) => {
  const [customDate, setCustomDate] = useState('');

  const handlePreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onSchedule(date.getTime());
  };

  const handleCustom = () => {
    if (!customDate) return;
    const date = new Date(customDate);
    // Set to end of day to avoid timezone confusion or early expiration
    date.setHours(23, 59, 59, 999);
    onSchedule(date.getTime());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5"/> Agendar Revisão Espaçada</h3>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4 text-sm">
            Escolha quando deseja revisar <strong>"{studyTitle}"</strong>. Baseado na Curva do Esquecimento de Ebbinghaus.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => handlePreset(1)} className="flex flex-col items-center justify-center p-3 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all hover:scale-105 active:scale-95">
                <span className="text-2xl mb-1">⚡</span>
                <span className="font-bold text-indigo-900">24 Horas</span>
                <span className="text-xs text-indigo-600">Revisão Imediata</span>
            </button>
             <button onClick={() => handlePreset(3)} className="flex flex-col items-center justify-center p-3 border border-indigo-100 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 active:scale-95">
                <span className="text-2xl mb-1">📅</span>
                <span className="font-bold text-gray-900">3 Dias</span>
                <span className="text-xs text-gray-500">Primeiro Reforço</span>
            </button>
             <button onClick={() => handlePreset(7)} className="flex flex-col items-center justify-center p-3 border border-indigo-100 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 active:scale-95">
                <span className="text-2xl mb-1">🧠</span>
                <span className="font-bold text-gray-900">7 Dias</span>
                <span className="text-xs text-gray-500">Consolidação</span>
            </button>
             <button onClick={() => handlePreset(15)} className="flex flex-col items-center justify-center p-3 border border-indigo-100 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 active:scale-95">
                <span className="text-2xl mb-1">🚀</span>
                <span className="font-bold text-gray-900">15 Dias</span>
                <span className="text-xs text-gray-500">Memória Longa</span>
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data Personalizada</label>
             <div className="flex gap-2">
                 <input 
                    type="date" 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                 />
                 <button onClick={handleCustom} disabled={!customDate} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50">Agendar</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
