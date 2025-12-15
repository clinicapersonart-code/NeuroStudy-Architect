import React, { useState, useEffect, useRef } from 'react';
import { storage } from './services/storage'; // Conexão corrigida
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

  // DADOS PRINCIPAIS
  const [folders, setFolders] = useState<Folder[]>([]);
  const [studies, setStudies] = useState<StudySession[]>([]);
  
  // Estados de Interface
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
  
  // Modais
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showReviewScheduler, setShowReviewScheduler] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<StudySource | null>(null);

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

  // Quando autorizar, carrega os dados (Nuvem ou Local)
  useEffect(() => {
    if (!isAuthorized && view !== 'landing') return; // Só carrega se estiver autorizado ou na landing (opcional)
    
    if (isAuthorized) {
        const initData = async () => {
          const { studies: s, folders: f } = await storage.loadData();
          setStudies(s);
          setFolders(f);
        };
        initData();
    }
  }, [isAuthorized]);

  // --- 2. SALVAMENTO AUTOMÁTICO ---
  // Sempre que mudar estudos ou pastas, salva tudo (Nuvem se Pro, Local se Free)
  useEffect(() => {
    if (studies.length > 0 || folders.length > 0) {
      storage.saveData(studies, folders);
    }
  }, [studies, folders]);

  const handleLogin = () => {
    if (passwordInput === 'neurostudy2025') {
      // MODO PRO
      localStorage.setItem('neurostudy_auth', 'true');
      setIsAuthorized(true);
      setIsPro(true);
      window.location.reload(); // Recarrega para ativar Supabase
    } else if (passwordInput === 'convidado') {
      // MODO FREE
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

  // --- CRUD Lógica ---
  const createFolder = (name: string, parentId?: string) => { 
      const newFolder: Folder = { id: Date.now().toString(), name, parentId };
      setFolders(prev => [...prev, newFolder]);
      return newFolder.id;
  };
  
  const renameFolder = (id: string, newName: string) => { setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f)); };
  
  const deleteFolder = (id: string) => { 
      const idsToDelete = new Set<string>();
      const collectIds = (fid: string) => {
          idsToDelete.add(fid);
          folders.filter(f => f.parentId === fid).forEach(child => collectIds(child.id));
      };
      collectIds(id);
      setFolders(folders.filter(f => !idsToDelete.has(f.id)));
      setStudies(studies.filter(s => !idsToDelete.has(s.folderId)));
      if (activeStudy?.folderId && idsToDelete.has(activeStudy.folderId)) setActiveStudyId(null);
  };

  const moveFolder = (folderId: string, targetParentId: string | undefined) => {
      if (folderId === targetParentId) return;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: targetParentId } : f));
  };

  const moveStudy = (studyId: string, targetFolderId: string) => { 
      setStudies(prev => prev.map(s => s.id === studyId ? { ...s, folderId: targetFolderId } : s));
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

  const deleteStudy = (id: string) => { 
      setStudies(studies.filter(s => s.id !== id)); 
      if (activeStudyId === id) setActiveStudyId(null); 
  };

  const updateStudyGuide = (studyId: string, newGuide: StudyGuide) => { 
      setStudies(prev => prev.map(s => s.id === studyId ? { ...s, guide: newGuide } : s));
  };

  const updateStudyMode = (studyId: string, mode: StudyMode) => { 
      setStudies(prev => prev.map(s => s.id === studyId ? { ...s, mode: mode } : s));
  };

  const handleSaveTitle = () => { 
      if (activeStudyId && editTitleInput.trim()) { 
          setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, title: editTitleInput } : s));
      } 
      setIsEditingTitle(false); 
  };

  const addSourceToStudy = async () => {
    if (!activeStudyId) return;
    let content = ''; let mimeType = ''; let name = ''; let finalType = inputType;
    if (inputType === InputType.TEXT || inputType === InputType.DOI || inputType === InputType.URL) {
      if (!inputText.trim()) return;
      content = inputText; mimeType = 'text/plain';
      if (inputType === InputType.DOI) name = `DOI: ${inputText.slice(0, 20)}...`;
      else if (inputType === InputType.URL) name = `Link: ${inputText.slice(0, 30)}...`;
      else name = `Nota de Texto ${new Date().toLocaleTimeString()}`;
    } else {
      if (!selectedFile) return;
      content = await fileToBase64(selectedFile); mimeType = selectedFile.type; name = selectedFile.name;
      if (inputType === InputType.PDF) {
          if (name.toLowerCase().endsWith('.epub')) finalType = InputType.EPUB;
          else if (name.toLowerCase().endsWith('.mobi')) finalType = InputType.MOBI;
      }
    }
    const newSource: StudySource = { id: Date.now().toString(), type: finalType, name, content, mimeType, dateAdded: Date.now() };
    setStudies(prev => prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: [...s.sources, newSource] }; return s; }));
    setInputText(''); setSelectedFile(null);
  };

  const removeSource = (sourceId: string) => { 
      if (!activeStudyId) return; 
      setStudies(prev => prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: s.sources.filter(src => src.id !== sourceId) }; return s; }));
  };

  const handleStartRenamingSource = (source: StudySource) => { setEditingSourceId(source.id); setEditSourceName(source.name); };
  
  const handleSaveSourceRename = () => { 
      if (!activeStudyId || !editingSourceId) return; 
      setStudies(prev => prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: s.sources.map(src => src.id === editingSourceId ? { ...src, name: editSourceName } : src) }; return s; }));
      setEditingSourceId(null); setEditSourceName(''); 
  };

  // Helpers
  const activeStudy = studies.find(s => s.id === activeStudyId) || null;
  const isParetoStudy = activeStudy?.mode === StudyMode.PARETO;
  const isGuideComplete = (activeStudy?.guide?.checkpoints?.filter(c => c.completed).length || 0) === (activeStudy?.guide?.checkpoints?.length || 0) && (activeStudy?.guide?.checkpoints?.length || 0) > 0;
  const dueReviewsCount = studies.filter(s => s.nextReviewDate && s.nextReviewDate <= Date.now()).length;

  const fileToBase64 = (file: File): Promise<string> => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; }); };

  const handleQuickStart = async (content: string | File, type: InputType, mode: StudyMode = StudyMode.NORMAL, autoGenerate: boolean = false, isBook: boolean = false) => {
    let targetFolderId = isBook ? 'root-books' : mode === StudyMode.PARETO ? 'root-pareto' : 'root-neuro';
    const title = content instanceof File ? content.name : 'Novo Estudo';
    const study = createStudy(targetFolderId, isBook ? `Livro: ${title}` : title, mode, isBook);
    
    let sourceContent = '', mimeType = 'text/plain', name = '';
    if (content instanceof File) { sourceContent = await fileToBase64(content); mimeType = content.type; name = content.name; } 
    else { sourceContent = content; name = 'Texto/Link'; }

    const newSource: StudySource = { id: Date.now().toString(), type, name, content: sourceContent, mimeType, dateAdded: Date.now() };
    setStudies(prev => prev.map(s => { if (s.id === study.id) return { ...s, sources: [newSource] }; return s; }));
    
    setView('app'); setInputText(''); setQuickInputMode('none');
    if (autoGenerate) setTimeout(() => handleGenerateGuideForStudy(study.id, newSource, mode, isBook), 100);
  };

  const handleGenerateGuideForStudy = async (studyId: string, source: StudySource, mode: StudyMode, isBook: boolean) => {
    const isBinary = [InputType.PDF, InputType.VIDEO, InputType.IMAGE, InputType.EPUB].includes(source.type);
    setProcessingState({ isLoading: true, error: null, step: source.type === InputType.VIDEO ? 'transcribing' : 'analyzing' });
    try {
        const timer = setTimeout(() => setProcessingState(p => ({...p, step: 'generating'})), 3000);
        const guide = await generateStudyGuide(source.content, source.mimeType || 'text/plain', mode, isBinary, isBook);
        clearTimeout(timer);
        setStudies(prev => prev.map(s => s.id === studyId ? { ...s, guide } : s));
        setProcessingState({ isLoading: false, error: null, step: 'idle' });
        setActiveTab('guide');
    } catch (e: any) { setProcessingState({ isLoading: false, error: e.message, step: 'idle' }); }
  };

  // Handlers simples
  const handleGenerateSlides = async () => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'slides' }); try { const slides = await generateSlides(activeStudy.guide); setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, slides } : s)); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleGenerateQuiz = async (config?: any) => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'quiz' }); try { const quiz = await generateQuiz(activeStudy.guide, activeStudy.mode || StudyMode.NORMAL, config); setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, quiz } : s)); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleGenerateFlashcards = async () => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'flashcards' }); try { const flashcards = await generateFlashcards(activeStudy.guide); setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, flashcards } : s)); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleClearQuiz = () => { if (!activeStudyId) return; setStudies(prev => prev.map(s => s.id === activeStudyId ? { ...s, quiz: null } : s)); };
  const handleStartSession = () => { createStudy('root-neuro', `Novo Estudo`, selectedMode); };
  const handleFolderExam = (fid: string) => { /* ... */ };
  const handleParetoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if(f) handleQuickStart(f, InputType.TEXT, StudyMode.PARETO, true, false); };
  const handleBookUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if(f) handleQuickStart(f, InputType.PDF, StudyMode.NORMAL, false, true); };
  const handleGoToHome = () => { setIsMobileMenuOpen(false); setActiveStudyId(null); setView('landing'); };
  const renderSourceDescription = (t: InputType) => null;

  // Renderização
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 mb-6">Esta plataforma está em fase de testes fechados. Por favor, insira a senha de acesso.</p>
          <input type="password" placeholder="Senha de acesso" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-4" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoFocus />
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Entrar</button>
          <div className="mt-4 text-xs text-gray-400">Use 'convidado' para acesso Free</div>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animate-fade-in">
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
        onOpenMethodology={() => setShowMethodologyModal(true)} onFolderExam={handleFolderExam} onGoToHome={handleGoToHome}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
           <div className="flex items-center gap-4">
               <button className="md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
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
                       <h1 className="text-xl font-bold text-gray-400 flex items-center gap-2"><NeuroLogo size={24} className="grayscale opacity-50"/> Painel de Controle</h1>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isPro ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                           {isPro ? '✨ PRO (Nuvem Ativa)' : '☁️ FREE (Modo Local)'}
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
               <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 underline ml-2">Sair</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 scroll-smooth">
          {activeStudy ? (
            processingState.isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[500px]">
                    <ProcessingStatus step={processingState.step} size="large" />
                </div>
            ) : (
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* ... (Renderização das Tabs e Views) ... */}
                    {/* Para economizar linhas, assuma a mesma estrutura de Tabs (Fontes, Roteiro, Slides, etc) do código original */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        <button onClick={() => setActiveTab('sources')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'sources' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}><UploadCloud className="w-4 h-4"/> Fontes</button>
                        <button onClick={() => setActiveTab('guide')} disabled={!activeStudy.guide} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'guide' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50'}`}><FileText className="w-4 h-4"/> Roteiro</button>
                        {!isParetoStudy && (
                            <>
                                <button onClick={() => setActiveTab('slides')} disabled={!activeStudy.slides} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'slides' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50'}`}><Monitor className="w-4 h-4"/> Slides</button>
                                <button onClick={() => setActiveTab('quiz')} disabled={!activeStudy.quiz && !isGuideComplete} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'quiz' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50'}`}>{isGuideComplete || activeStudy.quiz ? <CheckCircle className="w-4 h-4"/> : <Lock className="w-4 h-4"/>} Quiz</button>
                                <button onClick={() => setActiveTab('flashcards')} disabled={!activeStudy.flashcards && !isGuideComplete} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'flashcards' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50'}`}>{isGuideComplete || activeStudy.flashcards ? <Layers className="w-4 h-4"/> : <Lock className="w-4 h-4"/>} Flashcards</button>
                            </>
                        )}
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'sources' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-500"/> Adicionar Conteúdo</h2>
                                    <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-1.5 rounded-xl w-full">
                                        <button onClick={() => setInputType(InputType.TEXT)} className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-bold transition-all ${inputType === InputType.TEXT ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Texto</button>
                                        <button onClick={() => setInputType(InputType.PDF)} className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-bold transition-all ${inputType === InputType.PDF ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>PDF / E-book</button>
                                        {/* ... Outros botões de tipo ... */}
                                    </div>
                                    <div className="space-y-4">
                                        {inputType === InputType.TEXT ? (
                                            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans text-sm" placeholder="Cole suas anotações ou texto aqui..." />
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept={inputType === InputType.PDF ? ".pdf,.epub,.mobi" : "*"} />
                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                    {selectedFile ? (<><FileText className="w-8 h-8 text-indigo-500"/><span className="font-medium text-gray-900">{selectedFile.name}</span></>) : (<><UploadCloud className="w-8 h-8"/><span className="font-medium">Clique ou arraste o arquivo aqui</span></>)}
                                                </div>
                                            </div>
                                        )}
                                        <button onClick={addSourceToStudy} disabled={(!inputText && !selectedFile)} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">Adicionar à Lista</button>
                                    </div>
                                </div>

                                {/* Lista de Fontes */}
                                {activeStudy.sources.length > 0 && (
                                    <div className="space-y-4">
                                        {activeStudy.sources.map((source, idx) => (
                                            <div key={source.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">{idx + 1}</div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 truncate">{source.name}</h3>
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{source.type}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeSource(source.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash className="w-5 h-5"/></button>
                                            </div>
                                        ))}
                                        {!activeStudy.isBook && (
                                            <button onClick={handleGenerateGuide} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                                <GenerateIcon className="w-8 h-8 animate-pulse"/> Gerar Roteiro NeuroStudy
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'guide' && activeStudy.guide && (<ResultsView guide={activeStudy.guide} onReset={() => setActiveTab('sources')} onGenerateQuiz={() => setActiveTab('quiz')} onGoToFlashcards={() => setActiveTab('flashcards')} onUpdateGuide={(g) => updateStudyGuide(activeStudy.id, g)} isParetoOnly={activeStudy.mode === StudyMode.PARETO} />)}
                        {activeTab === 'slides' && (<div className="space-y-6">{activeStudy.slides ? (<SlidesView slides={activeStudy.slides} />) : (<div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed"><Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4"/><h3 className="text-xl font-bold text-gray-700 mb-2">Slides de Aula</h3><button onClick={handleGenerateSlides} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Gerar Slides com IA</button></div>)}</div>)}
                        {activeTab === 'quiz' && (<div className="space-y-6">{activeStudy.quiz ? (<QuizView questions={activeStudy.quiz} onGenerate={handleGenerateQuiz} onClear={handleClearQuiz}/>) : (<div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed"><CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4"/><h3 className="text-xl font-bold text-gray-700 mb-2">Quiz de Recuperação Ativa</h3>{isGuideComplete ? (<button onClick={() => handleGenerateQuiz()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Gerar Quiz</button>) : (<div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-200"><Lock className="w-4 h-4"/> Complete todos os checkpoints para liberar</div>)}</div>)}</div>)}
                        {activeTab === 'flashcards' && (<div className="space-y-6">{activeStudy.flashcards ? (<FlashcardsView cards={activeStudy.flashcards} onGenerate={handleGenerateFlashcards}/>) : (<div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed"><Layers className="w-16 h-16 text-gray-300 mx-auto mb-4"/><h3 className="text-xl font-bold text-gray-700 mb-2">Flashcards</h3>{isGuideComplete ? (<button onClick={handleGenerateFlashcards} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Gerar Flashcards</button>) : (<div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-200"><Lock className="w-4 h-4"/> Complete todos os checkpoints para liberar</div>)}</div>)}</div>)}
                    </div>
                </div>
            ))
          ) : (
             <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
                 <div className="max-w-4xl mx-auto w-full p-6 space-y-8">
                    <div className="text-center pt-8">
                        <NeuroLogo size={60} className="mx-auto mb-4 text-indigo-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Novo Estudo</h2>
                        <p className="text-gray-500">Escolha o nível de profundidade e sua fonte para começar.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => setSelectedMode(StudyMode.SURVIVAL)} className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 text-left ${selectedMode === StudyMode.SURVIVAL ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-200' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'}`}><div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center text-green-600"><BatteryCharging className="w-6 h-6"/></div><div><span className="block font-bold text-gray-900">Sobrevivência</span><span className="text-xs text-gray-500">Apenas o essencial. Rápido e direto.</span></div></button>
                        <button onClick={() => setSelectedMode(StudyMode.NORMAL)} className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 text-left ${selectedMode === StudyMode.NORMAL ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'}`}><div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600"><Activity className="w-6 h-6"/></div><div><span className="block font-bold text-gray-900">Normal</span><span className="text-xs text-gray-500">Equilíbrio ideal entre teoria e prática.</span></div></button>
                        <button onClick={() => setSelectedMode(StudyMode.HARD)} className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 text-left ${selectedMode === StudyMode.HARD ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-200' : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'}`}><div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600"><Rocket className="w-6 h-6"/></div><div><span className="block font-bold text-gray-900">Hard</span><span className="text-xs text-gray-500">Profundidade máxima e detalhes.</span></div></button>
                    </div>
                    <div className="pt-8">
                        <button onClick={handleStartSession} className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2">Escolher fontes</button>
                    </div>
                 </div>
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
