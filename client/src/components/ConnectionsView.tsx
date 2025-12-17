import React, { useState } from 'react';
import { StudyGuide } from '../types';
import { generateTool } from '../services/geminiService';
import { Globe } from './Icons';

interface ConnectionsViewProps {
  guide: StudyGuide;
  onUpdateGuide: (guide: StudyGuide) => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ guide, onUpdateGuide }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Usamos 'interdisciplinary' com o contexto global do guia
      const content = await generateTool('interdisciplinary', guide.title, JSON.stringify(guide.mainConcepts));
      
      const currentTools = guide.tools || {};
      onUpdateGuide({ 
          ...guide, 
          tools: { ...currentTools, interdisciplinary: content } 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Globe className="w-8 h-8"/></div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Conexões Interdisciplinares</h2>
                <p className="text-gray-500">Como este assunto se conecta com outras áreas?</p>
            </div>
        </div>

        {guide.tools?.interdisciplinary ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="prose prose-blue max-w-none bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-slate-700 leading-relaxed text-lg">
                    {guide.tools.interdisciplinary.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                    ))}
                </div>
                <button onClick={handleGenerate} className="mt-6 w-full py-3 bg-white border-2 border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                    Gerar Novas Conexões
                </button>
            </div>
        ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Expanda sua visão descobrindo como "{guide.title}" se aplica em História, Biologia, Economia e mais.</p>
                <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                    {loading ? 'Conectando Saberes...' : 'Explorar Conexões'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
