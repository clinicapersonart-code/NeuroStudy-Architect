import React, { useState, useEffect, useRef } from 'react';
import { StudyGuide, BookChapter } from '../types';
import { BrainCircuit, PenTool, Target, Eye, CheckCircle, Download, Printer, FileCode, HelpCircle, Brain, Image as ImageIcon, X, Sparkles, RefreshCw, Layers, Play, Lock, ChevronDown, ChevronRight, BookOpen, Clock } from './Icons';
import { refineContent, generateDiagram } from '../services/geminiService';

interface ResultsViewProps {
  guide: StudyGuide;
  onReset: () => void;
  onGenerateQuiz: () => void;
  onGoToFlashcards?: () => void; // Nova prop opcional
  onUpdateGuide?: (newGuide: StudyGuide) => void;
  isParetoOnly?: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ guide, onReset, onGenerateQuiz, onGoToFlashcards, onUpdateGuide, isParetoOnly = false }) => {
  const [activeMagicMenu, setActiveMagicMenu] = useState<{idx: number, type: 'concept' | 'checkpoint'} | null>(null);
  const [magicOutput, setMagicOutput] = useState<{idx: number, text: string} | null>(null);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [loadingImage, setLoadingImage] = useState<number | null>(null); 
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  const toggleChapter = (index: number) => {
      setExpandedChapters(prev => ({...prev, [index]: !prev[index]}));
  };

  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Calculate Progress
  const completedCount = guide.checkpoints ? guide.checkpoints.filter(cp => cp.completed).length : 0;
  const totalCount = guide.checkpoints ? guide.checkpoints.length : 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (textareaRefs.current) {
        textareaRefs.current.forEach(adjustTextareaHeight);
    }
  }, [guide.checkpoints]);

  const generateMarkdown = (guide: StudyGuide) => {
    return `---
tags: [estudo, neurostudy, ${guide.subject.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}]
assunto: ${guide.subject}
data: ${new Date().toLocaleDateString('pt-BR')}
status: 🟧 Ativo
progress: ${completedCount}/${totalCount}
---

# ${guide.subject}

## 🧠 ${isParetoOnly ? 'RESUMO PARETO 80/20' : 'Advance Organizer'}
${guide.overview}

${!isParetoOnly ? `
## 🎯 Conceitos Core (Pareto 80/20)
${guide.coreConcepts.map(c => `- **${c.concept}**: ${c.definition}`).join('\n')}

## 📍 Jornada de Aprendizagem (Checkpoints)

${guide.checkpoints.map((cp, i) => `### ${i+1}. ${cp.mission} [${cp.completed ? 'x' : ' '}]
> **Tempo**: ${cp.timestamp}

- 👁️ **Procurar**: ${cp.lookFor}
- 📝 **Anotar**: ${cp.noteExactly}
${cp.drawExactly && cp.drawLabel !== 'none' ? `- ✏️ **Desenhar (${cp.drawLabel})**: ${cp.drawExactly}` : ''}
${cp.imageUrl ? `![Diagrama](${cp.imageUrl})` : ''}
- ❓ **Pergunta**: ${cp.question}
`).join('\n')}
` : ''}

---
*Gerado por NeuroStudy Architect*
`;
  };

  const handleDownloadMD = () => {
    const md = generateMarkdown(guide);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_obsidian.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownloadPDF = () => {
    const element = document.getElementById('printable-guide');
    if (!element) return;
    setIsGeneratingPDF(true);
    element.classList.add('pdf-export');
    const opt = {
      margin: 5,
      filename: `${guide.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_neurostudy.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const worker = (window as any).html2pdf();
    worker.set(opt).from(element).save().then(() => {
        element.classList.remove('pdf-export');
        setIsGeneratingPDF(false);
    }).catch((err: any) => {
        console.error("PDF generation failed", err);
        element.classList.remove('pdf-export');
        setIsGeneratingPDF(false);
        alert("Erro ao gerar PDF. Tente a opção 'Imprimir' em vez disso.");
    });
  };

  const handleUpdateCheckpoint = (index: number, field: 'noteExactly' | 'drawExactly', value: string) => {
    if (!onUpdateGuide) return;
    const newCheckpoints = [...guide.checkpoints];
    newCheckpoints[index] = { ...newCheckpoints[index], [field]: value };
    onUpdateGuide({ ...guide, checkpoints: newCheckpoints });
  };

  const handleToggleCheckpoint = (index: number) => {
    if (!onUpdateGuide) return;
    const newCheckpoints = [...guide.checkpoints];
    newCheckpoints[index] = { 
      ...newCheckpoints[index], 
      completed: !newCheckpoints[index].completed,
      completedAt: !newCheckpoints[index].completed ? Date.now() : undefined
    };
    onUpdateGuide({ ...guide, checkpoints: newCheckpoints });
  };

  const handleMagicAction = async (text: string, task: 'simplify' | 'example' | 'mnemonic' | 'joke', idx: number) => {
    setLoadingMagic(true);
    setMagicOutput(null);
    try {
      const result = await refineContent(text, task);
      setMagicOutput({ idx, text: result });
    } catch (e) {
      console.error(e);
      setLoadingMagic(false);
    } finally {
      setLoadingMagic(false);
    }
  };

  const handleCloseMagic = () => {
      setActiveMagicMenu(null);
      setMagicOutput(null);
      setLoadingMagic(false);
  };

  const handleGenerateImage = async (checkpointIndex: number, description: string) => {
    if (loadingImage !== null) return;
    setLoadingImage(checkpointIndex);
    try {
        const imageUrl = await generateDiagram(description);
        if (onUpdateGuide) {
            const newCheckpoints = [...guide.checkpoints];
            newCheckpoints[checkpointIndex] = { ...newCheckpoints[checkpointIndex], imageUrl };
            onUpdateGuide({ ...guide, checkpoints: newCheckpoints });
        }
    } catch (e) {
        alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
        setLoadingImage(null);
    }
  };

  const renderFormatted = (text: string) => {
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-1 last:mb-0">
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    ));
  };

  // --- RENDERIZAÇÃO DE CAPÍTULOS (NOVO) ---
  const renderChapter = (chapter: BookChapter, index: number) => {
      const isExpanded = expandedChapters[index];
      
      return (
          <div key={index} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => toggleChapter(index)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                  <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                      <h4 className="font-bold text-gray-800 text-lg">{chapter.title}</h4>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {chapter.coreConcepts.length} Conceitos
                  </span>
              </button>

              {isExpanded && (
                  <div className="p-6 border-t border-gray-100 space-y-6">
                      {/* Resumo do Capítulo */}
                      <div className="prose prose-sm max-w-none text-gray-600">
                          <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4"/> Resumo</h5>
                          {renderMarkdownText(chapter.summary)}
                      </div>

                      {/* Conceitos Core do Capítulo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {chapter.coreConcepts.map((conc, idx) => (
                              <div key={idx} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                  <strong className="block text-yellow-900 mb-1">{conc.concept}</strong>
                                  <p className="text-sm text-yellow-800">{conc.definition}</p>
                              </div>
                          ))}
                      </div>

                      {/* Aplicação Prática */}
                      {chapter.practicalApplication && (
                          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                              <h5 className="font-bold text-emerald-900 flex items-center gap-2 mb-2"><Target className="w-4 h-4"/> Aplicação Prática</h5>
                              <p className="text-sm text-emerald-800">{chapter.practicalApplication}</p>
                          </div>
                      )}

                      {/* Seções (Modo Turbo) */}
                      {chapter.sections && chapter.sections.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-gray-100">
                              <h5 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Seções Detalhadas</h5>
                              {chapter.sections.map((sec, sIdx) => (
                                  <div key={sIdx} className="pl-4 border-l-2 border-indigo-100">
                                      <h6 className="font-bold text-gray-700 mb-2">{sec.title}</h6>
                                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                          {sec.coreConcepts.map((sc, scIdx) => (
                                              <li key={scIdx}><strong className="text-indigo-900">{sc.concept}:</strong> {sc.definition}</li>
                                          ))}
                                      </ul>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <button onClick={onReset} className="text-sm text-gray-500 hover:text-indigo-600 underline font-medium">
          ← {isParetoOnly ? 'Analisar outro arquivo' : 'Criar novo roteiro'}
        </button>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={handleDownloadMD} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" title="Baixar Nota para Obsidian (Markdown)"><FileCode className="w-4 h-4" /> Salvar Obsidian</button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors" title="Imprimir (Opção Nativa)"><Printer className="w-4 h-4" /> Imprimir</button>
          <button onClick={handleDirectDownloadPDF} disabled={isGeneratingPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50" title="Baixar arquivo PDF direto">{isGeneratingPDF ? <span className="animate-spin text-white">⌛</span> : <Download className="w-4 h-4" />} {isGeneratingPDF ? 'Gerando...' : 'Download PDF'}</button>
        </div>
      </div>

      <div id="printable-guide">
        {/* Header do Guia */}
        <div className={`bg-white rounded-xl paper-shadow p-8 border-t-4 ${isParetoOnly ? 'border-red-500' : 'border-indigo-500'} print:shadow-none print:border-0 print:border-t-0 print:mb-6`}>
            <div className="flex justify-between items-start mb-4"><h2 className="text-3xl font-serif font-bold text-gray-900">{guide.subject}</h2></div>
            
            <div className={`mb-6 p-6 rounded-lg border ${isParetoOnly ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'} print:bg-gray-50 print:border-gray-300`}>
                <div className={`flex items-center gap-2 mb-2 ${isParetoOnly ? 'text-red-700' : 'text-indigo-700'} font-semibold uppercase tracking-wide text-sm print:text-black`}>
                    <BrainCircuit className="w-5 h-5" />
                    <span>{isParetoOnly ? 'RESUMO EXECUTIVO (80/20)' : 'Visão Geral (Advance Organizer)'}</span>
                </div>
                <div className={`${isParetoOnly ? 'text-red-900 whitespace-pre-wrap' : 'text-indigo-900'} leading-relaxed text-lg font-serif print:text-black`}>
                    {renderMarkdownText(guide.overview)}
                </div>
                {guide.globalApplication && (
                    <div className="mt-4 pt-4 border-t border-indigo-100 text-indigo-800 text-sm">
                        <strong>💡 Aplicação Global:</strong> {guide.globalApplication}
                    </div>
                )}
            </div>

            {/* Conceitos Globais (Sobrevivência ou Intro) */}
            {guide.coreConcepts.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Target className={`w-6 h-6 ${isParetoOnly ? 'text-red-500' : 'text-indigo-500'} print:text-black`} />
                        {isParetoOnly ? 'Conceitos Chave (O 20%)' : 'Conceitos Fundamentais'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {guide.coreConcepts.map((item, idx) => {
                            const isActive = activeMagicMenu?.idx === idx && activeMagicMenu?.type === 'concept';
                            const hasResult = magicOutput?.idx === idx;
                            
                            return (
                                <div key={idx} className={`relative bg-white border border-gray-200 p-5 rounded-xl shadow-sm print:shadow-none print:border-black break-inside-avoid transition-all duration-300 ${isActive ? 'ring-2 ring-indigo-200' : ''}`}>
                                    <span className="block text-xs font-bold text-gray-400 mb-1 print:text-gray-600">CONCEITO #{idx + 1}</span>
                                    
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{item.concept}</h4>
                                        <div className="no-print shrink-0 ml-2">
                                            <button 
                                                onClick={() => isActive ? handleCloseMagic() : setActiveMagicMenu({idx, type: 'concept'})} 
                                                className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-100 text-indigo-700 rotate-90' : 'text-gray-300 hover:text-indigo-600 hover:bg-gray-50'}`} 
                                                title={isActive ? "Fechar Insight" : "Abrir Insight Cerebral"}
                                            >
                                                {isActive ? <X className="w-5 h-5"/> : <Brain className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* TOOLBAR EXPANDABLE */}
                                    {isActive && !loadingMagic && !hasResult && (
                                        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2 px-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Escolha uma lente cognitiva:</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button onClick={() => handleMagicAction(item.definition, 'simplify', idx)} className="text-left px-3 py-2 bg-white hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-sm rounded-lg text-indigo-900 transition-colors flex items-center gap-2 shadow-sm">👶 Explicar Simples</button>
                                                <button onClick={() => handleMagicAction(item.definition, 'example', idx)} className="text-left px-3 py-2 bg-white hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-sm rounded-lg text-indigo-900 transition-colors flex items-center gap-2 shadow-sm">🌍 Exemplo Real</button>
                                                <button onClick={() => handleMagicAction(item.definition, 'mnemonic', idx)} className="text-left px-3 py-2 bg-white hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-sm rounded-lg text-indigo-900 transition-colors flex items-center gap-2 shadow-sm">🧠 Criar Mnemônico</button>
                                                <button onClick={() => handleMagicAction(item.concept, 'joke', idx)} className="text-left px-3 py-2 bg-white hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-sm rounded-lg text-indigo-900 transition-colors flex items-center gap-2 shadow-sm">🎭 Criar Piada</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* LOADING STATE */}
                                    {loadingMagic && isActive && (
                                        <div className="mb-4 flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-indigo-100 border-dashed animate-pulse">
                                             <Brain className="w-10 h-10 text-indigo-500 animate-spin mb-2" />
                                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Processando Insight...</span>
                                        </div>
                                    )}

                                    {/* RESULT DISPLAY */}
                                    {hasResult && isActive && (
                                        <div className="mb-4 bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
                                            <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex justify-between items-center">
                                                <span className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1"><Brain className="w-3 h-3"/> Insight Gerado</span>
                                            </div>
                                            <div className="p-4 text-sm text-gray-700 leading-relaxed">
                                                {renderMarkdownText(magicOutput.text)}
                                            </div>
                                            <div className="bg-gray-50 px-3 py-2 text-center border-t border-gray-100">
                                                <button onClick={handleCloseMagic} className="text-xs text-indigo-600 font-bold hover:underline">Fechar Insight</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-800 border-l-4 border-yellow-400 font-mono print:bg-white print:border print:border-black print:italic leading-relaxed shadow-sm">
                                        <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">DEFINIÇÃO:</p>
                                        "{item.definition}"
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CAPÍTULOS (Novo para Normal/Turbo) */}
            {guide.chapters && guide.chapters.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-indigo-500" />
                        Estrutura do Livro ({guide.chapters.length} Capítulos)
                    </h3>
                    <div className="space-y-2">
                        {guide.chapters.map((chapter, idx) => renderChapter(chapter, idx))}
                    </div>
                </div>
            )}
        </div>

        {/* CHECKPOINTS (Jornada) - Mantido se houver */}
        {!isParetoOnly && guide.checkpoints && guide.checkpoints.length > 0 && (
            <div className="relative mt-8">
                {/* Header de progresso */}
                <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm no-print">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-gray-700 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500"/> Plano de Ação</span>
                        <span className="text-indigo-600 font-bold">{completedCount}/{totalCount} passos</span>
                    </div>
                    <div className="w-