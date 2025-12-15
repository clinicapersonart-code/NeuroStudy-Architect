import React, { useState, useEffect, useRef } from 'react';
import { storage } from './services/storage';
import { InputType, StudySession, Folder, StudyMode, ProcessingState, StudySource, StudyGuide } from './types';
import { generateStudyGuide, generateSlides, generateQuiz, generateFlashcards } from './services/geminiService';
import { ResultsView } from './components/ResultsView';
import { SlidesView } from './components/SlidesView';
import { QuizView } from './components/QuizView';
import { FlashcardsView } from './components/FlashcardsView';
import { ChatWidget } from './components/ChatWidget';
import { Sidebar } from './components/Sidebar';
import { MethodologyModal } from './components/MethodologyModal';
import { ProcessingStatus } from './components/ProcessingStatus';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ReviewSchedulerModal } from './components/ReviewSchedulerModal';
import { NotificationCenter } from './components/NotificationCenter';
import { SourcePreviewModal } from './components/SourcePreviewModal';
import { NeuroLogo, UploadCloud, FileText, Video, Search, BookOpen, Monitor, CheckCircle, Layers, Target, Menu, Lock, Bell, Calendar, GenerateIcon, Eye, Edit, Trash, BatteryCharging, Activity, Rocket } from './components/Icons';

export function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // DADOS
  const [folders, setFolders] = useState<Folder[]>([]);
  const [studies, setStudies] = useState<StudySession[]>([]);
  
  // Interface
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'guide' | 'slides' | 'quiz' | 'flashcards'>('sources');
  const [processingState, setProcessingState] = useState<ProcessingState>({ isLoading: false, error: null, step: 'idle' });
  
  // Inputs
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT);
  const [selectedMode, setSelectedMode] = useState<StudyMode>(StudyMode.NORMAL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [quickInputMode, setQuickInputMode] = useState<'none' | 'text'>('none');
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [previewSource, setPreviewSource] = useState<StudySource | null>(null);
  
  // Modais
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showReviewScheduler, setShowReviewScheduler] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const paretoInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // --- 1. LOGIN & CARREGAMENTO ---
  useEffect(() => {
    const auth = localStorage.getItem('neurostudy_auth');
    if (auth === 'true') {
      setIsAuthorized(true);
      setIsPro(true);
    } else {
      setIsAuthorized(false); 
    }
  }, []);

  // Carrega dados ao autorizar
  useEffect(() => {
    if (!isAuthorized && view !== 'landing') return;
    
    if (isAuthorized) {
        const initData = async () => {
          try {
            const { studies: s, folders: f } = await storage.loadData();
            setStudies(s || []);
            setFolders(f || []);
          } catch (e) {
            console.error("Erro ao carregar:", e);
            setStudies([]);
            setFolders([]);
          }
        };
        initData();
    }
  }, [isAuthorized, view]);

  // --- 2. SALVAMENTO AUTOMÁTICO ---
  useEffect(() => {
    if (studies.length > 0 || folders.length > 0) {
      storage.saveData(studies, folders);
    }
  }, [studies, folders]);

  const handleLogin = () => {
    if (passwordInput === 'neurostudy2025') {
      localStorage.setItem('neurostudy_auth', 'true');
      setIsAuthorized(true);
      setIsPro(true);
      window.location.reload(); 
    } else if (passwordInput === 'convidado') {
      localStorage.removeItem('neurostudy_auth');
      setIsAuthorized(true);
      setIsPro(false);
    } else {
      alert('Senha incorreta.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('neurostudy_auth');
    setIsAuthorized(false);
    setStudies([]); setFolders([]);
    setView('landing');
  };

  // --- CRUD ---
  const createFolder = (name: string, parentId?: string) => { 
      const newFolder: Folder = { id: Date.now().toString(), name, parentId }; 
      setFolders(prev => [...prev, newFolder]); 
      return newFolder.id; 
  };
  
  const createStudy = (folderId: string, title: string, mode: StudyMode = selectedMode, isBook: boolean = false) => {
    const newStudy: StudySession = {
      id: Date.now().toString(), folderId, title, sources: [], mode, isBook,
      guide: null, slides: null, quiz: null, flashcards: null, createdAt: Date.now(), updatedAt: Date.now()
    };
    setStudies(prev => [newStudy, ...prev]);
    setActiveStudyId(newStudy.id);
    setActiveTab('sources');
    return newStudy;
  };

  const updateStudy = (id: string, updates: Partial<StudySession>) => {
      setStudies(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
  };

  const deleteStudy = (id: string) => { 
      setStudies(prev => prev.filter(s => s.id !== id)); 
      if (activeStudyId === id) setActiveStudyId(null); 
  };

  const deleteFolder = (id: string) => { 
      const idsToDelete = new Set<string>();
      const collectIds = (fid: string) => {
          idsToDelete.add(fid);
          folders.filter(f => f.parentId === fid).forEach(child => collectIds(child.id));
      };
      collectIds(id);
      setFolders(prev => prev.filter(f => !idsToDelete.has(f.id)));
      setStudies(prev => prev.filter(s => !idsToDelete.has(s.folderId)));
      if (activeStudy?.folderId && idsToDelete.has(activeStudy.folderId)) setActiveStudyId(null);
  };

  const renameFolder = (id: string, name: string) => setFolders(p => p.map(f => f.id === id ? {...f, name} : f));
  const moveFolder = (fid: string, pid?: string) => setFolders(p => p.map(f => f.id === fid ? {...f, parentId: pid} : f));
  const moveStudy = (sid: string, fid: string) => updateStudy(sid, { folderId: fid });
  const handleSaveTitle = () => { if (activeStudyId && editTitleInput.trim()) updateStudy(activeStudyId, { title: editTitleInput }); setIsEditingTitle(false); };
  
  const updateStudyGuide = (studyId: string, newGuide: StudyGuide) => { updateStudy(studyId, { guide: newGuide }); };
  const updateStudyMode = (studyId: string, mode: StudyMode) => { updateStudy(studyId, { mode }); };

  const activeStudy = studies.find(s => s.id === activeStudyId) || null;
  const isParetoStudy = activeStudy?.mode === StudyMode.PARETO;
  const isGuideComplete = (activeStudy?.guide?.checkpoints?.filter(c => c.completed).length || 0) === (activeStudy?.guide?.checkpoints?.length || 0) && (activeStudy?.guide?.checkpoints?.length || 0) > 0;
  const dueReviewsCount = studies.filter(s => s.nextReviewDate && s.nextReviewDate <= Date.now()).length;

  const fileToBase64 = (file: File): Promise<string> => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; }); };

  const handleQuickStart = async (content: string | File, type: InputType, mode: StudyMode = StudyMode.NORMAL, autoGenerate: boolean = false, isBook: boolean = false) => {
    let targetFolderId = isBook ? 'root-books' : mode === StudyMode.PARETO ? 'root-pareto' : 'root-neuro';
    const title = content instanceof File ? content.name : 'Novo Estudo';
    const study = createStudy(targetFolderId, isBook ? `Livro: ${title}` : title, mode, isBook);
    
    let sourceContent = content instanceof File ? await fileToBase64(content) : content;
    let name = content instanceof File ? content.name : 'Texto/Link';
    let mimeType = content instanceof File ? content.type : 'text/plain';

    const newSource: StudySource = { id: Date.now().toString(), type, name, content: sourceContent, mimeType, dateAdded: Date.now() };
    updateStudy(study.id, { sources: [newSource] });
    
    setView('app'); setInputText(''); setQuickInputMode('none');
    if (autoGenerate) setTimeout(() => handleGenerateGuideForStudy(study.id, newSource, mode, isBook), 100);
  };

  const handleGenerateGuideForStudy = async (studyId: string, source: StudySource, mode: StudyMode, isBook: boolean) => {
    setProcessingState({ isLoading: true, error: null, step: 'analyzing' });
    try {
        const guide = await generateStudyGuide(source.content, source.mimeType || 'text/plain', mode, [InputType.PDF, InputType.VIDEO, InputType.IMAGE].includes(source.type), isBook);
        updateStudy(studyId, { guide });
        setActiveTab('guide');
    } catch (e: any) { setProcessingState({ isLoading: false, error: e.message, step: 'idle' }); } finally { setProcessingState(p => ({...p, isLoading: false, step: 'idle'})); }
  };

  const addSourceToStudy = async () => {
      if(!activeStudyId) return;
      let content = inputText; let type = inputType; let name = "Texto"; let mime = "text/plain";
      if(selectedFile) { content = await fileToBase64(selectedFile); type = inputType; name = selectedFile.name; mime = selectedFile.type; }
      const newSource: StudySource = { id: Date.now().toString(), type, name, content, mimeType: mime, dateAdded: Date.now() };
      setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, sources: [...s.sources, newSource] } : s));
      setInputText(''); setSelectedFile(null);
  };

  const removeSource = (sid: string) => setStudies(p => p.map(s => s.id === activeStudyId ? {...s, sources: s.sources.filter(x => x.id !== sid)} : s));
  const handleStartRenamingSource = (source: StudySource) => { setEditingSourceId(source.id); setEditSourceName(source.name); };
  const handleSaveSourceRename = () => { if (!activeStudyId || !editingSourceId) return; setStudies(prev => prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: s.sources.map(src => src.id === editingSourceId ? { ...src, name: editSourceName } : src) }; return s; })); setEditingSourceId(null); setEditSourceName(''); };
  
  const handleGenerateSlides = async () => { if(activeStudy?.guide) { setProcessingState({isLoading:true, error:null, step:'slides'}); const s = await generateSlides(activeStudy.guide); updateStudy(activeStudyId!, { slides: s }); setProcessingState(p=>({...p, isLoading:false})); }};
  const handleGenerateQuiz = async () => { if(activeStudy?.guide) { setProcessingState({isLoading:true, error:null, step:'quiz'}); const q = await generateQuiz(activeStudy.guide, activeStudy.mode); updateStudy(activeStudyId!, { quiz: q }); setProcessingState(p=>({...p, isLoading:false})); }};
  const handleGenerateFlashcards = async () => { if(activeStudy?.guide) { setProcessingState({isLoading:true, error:null, step:'flashcards'}); const f = await generateFlashcards(activeStudy.guide); updateStudy(activeStudyId!, { flashcards: f }); setProcessingState(p=>({...p, isLoading:false})); }};
  
  // Render Helpers
  const handleParetoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if(f) handleQuickStart(f, InputType.TEXT, StudyMode.PARETO, true, false); };
  const handleBookUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if(f) handleQuickStart(f, InputType.PDF, StudyMode.NORMAL, false, true); };
  const handleStartSession = () => { createStudy('root-neuro', `Novo Estudo`, selectedMode); };
  const handleFolderExam = (fid: string) => {}; 
  const renderSourceDescription = (t: InputType) => null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <NeuroLogo size={60} className="mx-auto mb-6 text-indigo-600"/>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">NeuroStudy Architect</h1>
          <input type="password" placeholder="Senha de acesso" className="w-full px-4 py-3 rounded-lg border border-gray-300 mb-4" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoFocus />
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Entrar</button>
          <div className="mt-4 text-xs text-gray-400">Use 'convidado' para acesso Free</div>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            <header className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200">
                <div className="flex items-center gap-2"><NeuroLogo size={40} className="text-indigo-600" /><span className="font-extrabold text-slate-900 tracking-tight text-xl">NeuroStudy</span></div>
                <button onClick={() => setView('app')} className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors">Entrar no Painel →</button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-5xl mx-auto space-y-12">
                    <div className="space-y-4">
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest border border-indigo-100">Neurociência Aplicada</span>
                        <div className="flex justify-center mb-8"><NeuroLogo size={130} className="drop-shadow-2xl" /></div>
                        <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">Pare de estudar.<br/><span className="text-indigo-600">Comece a aprender.</span></h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Bem-vindo, {isPro ? 'Membro Pro' : 'Visitante'}. Sua jornada começa agora.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <button onClick={() => setView('app')} className="group relative flex flex-col items-start p-6 bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-200 rounded-2xl transition-all w-full md:w-80 shadow-sm hover:shadow-xl hover:-translate-y-1">
                            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform"><Layers className="w-8 h-8" /></div>
                            <h3 className="text-lg font-bold text-gray-900">Método NeuroStudy</h3>
                            <p className="text-sm text-gray-500 mt-2 text-left flex-1">Acesso completo. Pastas, roteiros, flashcards e professor virtual.</p>
                            <span className="mt-4 w-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-1 px-4 py-3 rounded-lg group-hover:bg-indigo-700 transition-colors">Iniciar <ChevronRight className="w-4 h-4" /></span>
                        </button>
                        <div className="relative group w-full md:w-80">
                            <input type="file" ref={bookInputRef} className="hidden" onChange={handleBookUpload} accept=".pdf,.epub,.mobi"/>
                            <button onClick={() => bookInputRef.current?.click()} className="relative flex flex-col items-start p-6 bg-white hover:bg-orange-50 border-2 border-orange-100 hover:border-orange-200 rounded-2xl transition-all w-full shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                <div className="bg-orange-100 p-3 rounded-xl text-orange-600 mb-4 group-hover:scale-110 transition-transform"><BookOpen className="w-8 h-8" /></div>
                                <h3 className="text-lg font-bold text-gray-900">Resumo de Livros</h3>
                                <p className="text-sm text-gray-500 mt-2 text-left flex-1">Analise livros inteiros. Modos Sobrevivência, Normal e Hard.</p>
                                <span className="mt-4 w-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-1 px-4 py-3 rounded-lg group-hover:bg-orange-600 transition-colors">Iniciar <ChevronRight className="w-4 h-4" /></span>
                            </button>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <input type="file" ref={paretoInputRef} className="hidden" onChange={handleParetoUpload} accept=".pdf, video/*, audio/*, image/*, .epub, .mobi"/>
                            <button onClick={() => paretoInputRef.current?.click()} className="relative flex flex-col items-start p-6 bg-white hover:bg-red-50 border-2 border-red-100 hover:border-red-200 rounded-2xl transition-all w-full shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                <div className="bg-red-100 p-3 rounded-xl text-red-600 mb-4 group-hover:scale-110 transition-transform"><Target className="w-8 h-8" /></div>
                                <h3 className="text-lg font-bold text-gray-900">Método Pareto 80/20</h3>
                                <p className="text-sm text-gray-500 mt-2 text-left flex-1">Extração rápida. Apenas o essencial do arquivo.</p>
                                <span className="mt-4 w-full bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-1 px-4 py-3 rounded-lg group-hover:bg-red-700 transition-colors">Iniciar <ChevronRight className="w-4 h-4" /></span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="py-6 text-center border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-500 font-medium">Desenvolvido por <span className="text-gray-900 font-bold">Bruno Alexandre</span></p>
            </footer>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden">
      <Sidebar 
        folders={folders} studies={studies} activeStudyId={activeStudyId} 
        onSelectStudy={setActiveStudyId} onCreateFolder={createFolder} 
        onCreateStudy={(fid, t) => createStudy(fid, t)} 
        onDeleteStudy={deleteStudy} onDeleteFolder={deleteFolder}
        onRenameFolder={renameFolder} onMoveFolder={moveFolder} onMoveStudy={moveStudy}
        onOpenMethodology={() => setShowMethodologyModal(true)} onFolderExam={handleFolderExam} onGoToHome={() => setView('landing')}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
           <div className="flex items-center gap-4">
               <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
               {activeStudy ? (
                   <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                           {isEditingTitle ? (
                               <input autoFocus value={editTitleInput} onChange={(e) => setEditTitleInput(e.target.value)} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()} className="font-bold text-xl text-gray-900 border-b border-indigo-500 outline-none bg-transparent" />
                           ) : (
                               <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 group cursor-pointer" onClick={() => { setEditTitleInput(activeStudy.title); setIsEditingTitle(true); }}>
                                  {activeStudy.title}
                                  <Edit className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </h1>
                           )}
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${activeStudy.isBook ? 'bg-orange-50 text-orange-600 border-orange-100' : activeStudy.mode === StudyMode.PARETO ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                               {activeStudy.isBook ? 'MODO LIVRO' : activeStudy.mode}
                           </span>
                       </div>
                       <p className="text-xs text-gray-500">Atualizado em {new Date(activeStudy.updatedAt).toLocaleDateString()}</p>
                   </div>
               ) : ( 
                   <div className="flex items-center gap-3">
                       <h1 className="text-xl font-bold text-gray-400 flex items-center gap-2"><NeuroLogo size={24} className="grayscale opacity-50"/> Painel</h1>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isPro ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                           {isPro ? '✨ PRO' : '☁️ FREE'}
                       </span>
                   </div>
               )}
           </div>
           <div className="flex items-center gap-3">
               {activeStudy && (
                   <>
                      <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setShowNotifications(!showNotifications)}><Bell className="w-5 h-5"/>{dueReviewsCount > 0 && (<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>)}</button>
                      {showNotifications && (<><div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div><NotificationCenter studies={studies} onSelectStudy={setActiveStudyId} onClose={() => setShowNotifications(false)} /></>)}
                      <button onClick={() => setShowReviewScheduler(true)} className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"><Calendar className="w-4 h-4"/> Agendar Revisão</button>
                   </>
               )}
               <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Sair</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          {activeStudy ? (
            processingState.isLoading ? (
                <div className="flex items-center justify-center h-full"><ProcessingStatus step={processingState.step} size="large" /></div>
            ) : (
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button onClick={() => setActiveTab('sources')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'sources' ? 'bg-white shadow' : 'text-gray-500'}`}>Fontes</button>
                        <button onClick={() => setActiveTab('guide')} disabled={!activeStudy.guide} className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">Roteiro</button>
                        {!isParetoStudy && <button onClick={() => setActiveTab('quiz')} disabled={!activeStudy.quiz} className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">Quiz</button>}
                    </div>

                    {activeTab === 'sources' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setInputType(InputType.TEXT)} className="px-3 py-1 bg-gray-100 rounded text-sm">Texto</button>
                                    <button onClick={() => setInputType(InputType.PDF)} className="px-3 py-1 bg-gray-100 rounded text-sm">PDF</button>
                                </div>
                                {inputType === InputType.TEXT ? (
                                    <textarea value={inputText} onChange={e => setInputText(e.target.value)} className="w-full h-32 border rounded p-2" placeholder="Cole seu texto..." />
                                ) : (
                                    <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                )}
                                <button onClick={addSourceToStudy} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded font-bold">Adicionar</button>
                            </div>
                            
                            {activeStudy.sources.map(s => (
                                <div key={s.id} className="bg-white p-4 rounded border flex justify-between">
                                    <span>{s.name}</span>
                                    <button onClick={() => removeSource(s.id)}><Trash className="w-4 h-4 text-red-500"/></button>
                                </div>
                            ))}
                            
                            {!activeStudy.isBook && activeStudy.sources.length > 0 && (
                                <button onClick={() => handleGenerateGuideForStudy(activeStudy.id, activeStudy.sources[0], activeStudy.mode, false)} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-4">Gerar Roteiro</button>
                            )}
                        </div>
                    )}

                    {activeTab === 'guide' && activeStudy.guide && <ResultsView guide={activeStudy.guide} onReset={()=>{}} onGenerateQuiz={handleGenerateQuiz} onGoToFlashcards={handleGenerateFlashcards} />}
                    {activeTab === 'quiz' && activeStudy.quiz && <QuizView questions={activeStudy.quiz} onGenerate={handleGenerateQuiz} onClear={() => updateStudy(activeStudyId!, { quiz: null })} />}
                </div>
            )
          ) : (
             <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-bold mb-4">Comece um novo estudo</h2>
                <button onClick={() => handleQuickStart("Exemplo", InputType.TEXT)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Criar Teste Rápido</button>
             </div>
          )}
        </div>

        <PomodoroTimer />
        <ChatWidget studyGuide={activeStudy?.guide || null} />
        {showMethodologyModal && <MethodologyModal onClose={() => setShowMethodologyModal(false)} />}
        {previewSource && <SourcePreviewModal source={previewSource} onClose={() => setPreviewSource(null)} />}
      </div>
    </div>
  );
}
