
import React from 'react';
import { StudySession } from '../types';
import { Clock, Calendar, ChevronRight, CheckCircle } from './Icons';

interface NotificationCenterProps {
  studies: StudySession[];
  onSelectStudy: (id: string) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ studies, onSelectStudy, onClose }) => {
  const now = Date.now();
  
  // Filter for due reviews (nextReviewDate exists and is in the past or today)
  const dueReviews = studies.filter(s => s.nextReviewDate && s.nextReviewDate <= now).sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0));
  
  // Upcoming reviews (next 3 days)
  const upcomingReviews = studies.filter(s => s.nextReviewDate && s.nextReviewDate > now && s.nextReviewDate <= now + (3 * 24 * 60 * 60 * 1000)).sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0));

  return (
    <div className="absolute top-16 right-4 md:right-8 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
        <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">Suas Revisões</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{dueReviews.length} Pendentes</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
            {dueReviews.length === 0 && upcomingReviews.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">Tudo em dia! Nenhuma revisão agendada para breve.</p>
                </div>
            ) : (
                <>
                    {dueReviews.length > 0 && (
                        <div className="p-2">
                             <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 px-2">Atrasadas / Hoje</p>
                             <div className="space-y-1">
                                {dueReviews.map(study => (
                                    <button 
                                        key={study.id} 
                                        onClick={() => { onSelectStudy(study.id); onClose(); }}
                                        className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 text-sm line-clamp-1">{study.title}</span>
                                            <span className="text-[10px] text-red-500 font-mono bg-red-100 px-1.5 py-0.5 rounded">Agora</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3"/>
                                            <span>Agendado para {new Date(study.nextReviewDate!).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}

                    {upcomingReviews.length > 0 && (
                        <div className="p-2 border-t border-gray-100">
                             <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 px-2 mt-2">Próximos 3 Dias</p>
                             <div className="space-y-1">
                                {upcomingReviews.map(study => (
                                    <button 
                                        key={study.id} 
                                        onClick={() => { onSelectStudy(study.id); onClose(); }}
                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-gray-700 text-sm line-clamp-1">{study.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3"/>
                                            <span>{new Date(study.nextReviewDate!).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};
