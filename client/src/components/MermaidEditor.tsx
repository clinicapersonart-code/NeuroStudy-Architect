
import React, { useState, useEffect } from 'react';
import { Edit, RefreshCw, X, CheckCircle, Image } from './Icons';

interface MermaidEditorProps {
    initialCode: string;
    onUpdate: (newCode: string, newUrl: string) => void;
}

export const MermaidEditor: React.FC<MermaidEditorProps> = ({ initialCode, onUpdate }) => {
    const [code, setCode] = useState(initialCode);
    const [imageUrl, setImageUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Função para gerar URL do Mermaid.ink
    const generateUrl = (mermaidCode: string) => {
        try {
            const encoded = btoa(unescape(encodeURIComponent(mermaidCode)));
            return `https://mermaid.ink/img/${encoded}?bgColor=FFFFFF`;
        } catch (e) {
            console.error(e);
            return '';
        }
    };

    useEffect(() => {
        setCode(initialCode);
        setImageUrl(generateUrl(initialCode));
    }, [initialCode]);

    const handlePreview = () => {
        const url = generateUrl(code);
        setImageUrl(url);
        setError(null);
    };

    const handleSave = () => {
        const url = generateUrl(code);
        onUpdate(code, url);
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Visualização da Imagem */}
            <div className={`relative group w-full bg-white rounded-lg transition-all duration-300 ${isEditing ? 'opacity-50 blur-sm pointer-events-none' : ''}`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Diagrama Mermaid"
                        className="w-full h-auto rounded-lg shadow-sm border border-gray-100"
                        onError={() => setError("Erro ao renderizar diagrama. Verifique a sintaxe.")}
                    />
                ) : (
                    <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Diagrama não disponível</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 text-red-600 font-bold p-4 text-center rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Controles */}
            <div className="flex justify-end gap-2">
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                        <Edit className="w-4 h-4" /> Editar Diagrama
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in">
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                            title="Atualizar pré-visualização"
                        >
                            <RefreshCw className="w-4 h-4" /> Preview
                        </button>
                        <button
                            onClick={() => { setIsEditing(false); setCode(initialCode); handlePreview(); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" /> Salvar Alterações
                        </button>
                    </div>
                )}
            </div>

            {/* Área de Edição (Só aparece quando isEditing = true) */}
            {isEditing && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Código Mermaid (Graph TD)</label>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-64 p-4 font-mono text-xs bg-gray-800 text-green-400 rounded-xl shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                        spellCheck={false}
                    />
                    <p className="text-[10px] text-gray-400 mt-2 px-1">
                        Dica: Use <code>graph TD</code> para vertical. Sintaxe: <code>A[Texto] --&gt; B(Outro)</code>. Estilos: <code>style A fill:#f9f</code>.
                    </p>
                </div>
            )}
        </div>
    );
};
