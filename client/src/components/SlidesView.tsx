import React, { useState } from 'react';
import { SlideContent } from '../types';
import { Monitor, Edit, Lock, CheckCircle } from './Icons';

interface SlidesViewProps {
  slides: SlideContent[];
  onUpdateSlides?: (newSlides: SlideContent[]) => void;
}

export const SlidesView: React.FC<SlidesViewProps> = ({ slides, onUpdateSlides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlides, setEditedSlides] = useState<SlideContent[]>(slides);

  // Sincroniza estado de edição se props mudarem externamente
  React.useEffect(() => {
    setEditedSlides(slides);
  }, [slides]);

  const nextSlide = () => { if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1); };
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1); };

  const handleSave = () => {
    if (onUpdateSlides) {
      onUpdateSlides(editedSlides);
    }
    setIsEditing(false);
  };

  const updateSlideField = (field: keyof SlideContent, value: string | string[]) => {
    const newSlides = [...editedSlides];
    // @ts-ignore
    newSlides[currentSlide] = { ...newSlides[currentSlide], [field]: value };
    setEditedSlides(newSlides);
  };

  const updateBullet = (bulletIndex: number, text: string) => {
    const newSlides = [...editedSlides];
    const newBullets = [...newSlides[currentSlide].bullets];
    newBullets[bulletIndex] = text;
    newSlides[currentSlide] = { ...newSlides[currentSlide], bullets: newBullets };
    setEditedSlides(newSlides);
  };

  if (!slides || slides.length === 0) return <div className="text-center p-8 text-gray-500">Nenhum slide gerado ainda.</div>;

  const slide = isEditing ? editedSlides[currentSlide] : slides[currentSlide];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Toolbar de Controle */}
      <div className="flex justify-end mb-2">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <Lock className="w-4 h-4" /> Desbloquear Edição
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mr-2 animate-pulse">Modo Edição Ativo</span>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md">
              <CheckCircle className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        )}
      </div>

      <div className={`aspect-video bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col relative transition-all ${isEditing ? 'ring-4 ring-indigo-100' : ''}`}>
        <div className="flex-1 p-12 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50">
          {isEditing ? (
            <input
              value={slide.title}
              onChange={(e) => updateSlideField('title', e.target.value)}
              className="text-3xl font-bold text-slate-800 mb-8 border-b-4 border-indigo-500 pb-4 w-full bg-transparent outline-none focus:bg-indigo-50/50 rounded"
            />
          ) : (
            <h2 className="text-3xl font-bold text-slate-800 mb-8 border-b-4 border-indigo-500 pb-4 inline-block self-start">{slide.title}</h2>
          )}

          <ul className="space-y-4">
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xl text-slate-700">
                <span className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                {isEditing ? (
                  <input
                    value={bullet}
                    onChange={(e) => updateBullet(idx, e.target.value)}
                    className="flex-1 bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none"
                  />
                ) : (
                  <span>{bullet}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="h-12 bg-slate-100 flex items-center justify-between px-6 text-sm text-slate-500 border-t border-gray-200"><span>NeuroStudy Architect</span><span>{currentSlide + 1} / {slides.length}</span></div>
      </div>
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium">Anterior</button>
        <div className="flex gap-2">{slides.map((_, idx) => (<button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-3 h-3 rounded-full transition-colors ${idx === currentSlide ? 'bg-indigo-600' : 'bg-gray-300'}`} />))}</div>
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium">Próximo</button>
      </div>
      <div className={`bg-yellow-50 p-6 rounded-xl border border-yellow-200 transition-all ${isEditing ? 'ring-2 ring-yellow-300' : ''}`}>
        <h4 className="text-sm font-bold text-yellow-800 uppercase mb-2 flex items-center gap-2"><Monitor className="w-4 h-4" /> Notas do Apresentador</h4>
        {isEditing ? (
          <textarea
            value={slide.speakerNotes}
            onChange={(e) => updateSlideField('speakerNotes', e.target.value)}
            className="w-full h-24 p-2 bg-white/50 border border-yellow-300 rounded text-yellow-900 font-serif resize-none outline-none focus:bg-white"
          />
        ) : (
          <p className="text-yellow-900 leading-relaxed font-serif">{slide.speakerNotes}</p>
        )}
      </div>
    </div>
  );
};