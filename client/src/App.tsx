import React, { useState, useEffect, useRef } from 'react';
import { InputType, ProcessingState, StudyGuide, StudySession, Folder, StudySource, StudyMode } from './types';
import { generateStudyGuide, generateSlides, generateQuiz, generateFlashcards } from './services/geminiService';
import { storage } from './services/storage'; // <--- O SEGREDO ESTÁ AQUI
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
import { NeuroLogo, Brain, UploadCloud, FileText, Video, Search, BookOpen, Monitor, HelpCircle, Plus, Trash, Zap, Link, Rocket, BatteryCharging, Activity, GraduationCap, Globe, Edit, CheckCircle, Layers, Camera, Target, ChevronRight, Menu, Lock, Bell, Calendar, GenerateIcon, Eye, Settings, Play } from './components/Icons';

export function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  useEffect(() => {
    const authorized = localStorage.getItem('neurostudy_auth');
    if (authorized === 'true') setIsAuthorized(true);
  }, []);

  const handleLogin = () => {
    if (passwordInput === 'neurostudy2025') {
      setIsAuthorized(true);
      localStorage.setItem('neurostudy_auth', 'true');
    } else {
      alert('Senha incorreta.');
    }
  };

  const [view, setView] = useState<'landing' | 'app'>('landing');
  
  // INICIALIZAÇÃO
  const [folders, setFolders] = useState<Folder[]>([]); 
  const [studies, setStudies] = useState<StudySession[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  
  // CARREGAR DADOS SALVOS
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthorized) return;
      const savedStudies = await storage.getAll();
      if (savedStudies.length > 0) {
        setStudies(savedStudies);
      }
    };
    loadData();
  }, [isAuthorized]);

  const [activeTab, setActiveTab] = useState<'sources' | 'guide' | 'slides' | 'quiz' | 'flashcards'>('sources');
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMode, setSelectedMode] = useState<StudyMode>(StudyMode.NORMAL);
  const [quickInputMode, setQuickInputMode] = useState<'none' | 'text'>('none');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [previewSource, setPreviewSource] = useState<StudySource | null>(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showReviewScheduler, setShowReviewScheduler] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({ isLoading: false, error: null, step: 'idle' });

  const paretoInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  const activeStudy = studies.find(s => s.id === activeStudyId) || null;
  const isParetoStudy = activeStudy?.mode === StudyMode.PARETO;
  
  const totalCheckpoints = activeStudy?.guide?.checkpoints?.length || 0;
  const completedCheckpoints = activeStudy?.guide?.checkpoints?.filter(c => c.completed).length || 0;
  const isGuideComplete = totalCheckpoints > 0 && totalCheckpoints === completedCheckpoints;
  const dueReviewsCount = studies.filter(s => s.nextReviewDate && s.nextReviewDate <= Date.now()).length;

  useEffect(() => {
      setIsEditingTitle(false);
      setEditTitleInput('');
      setIsMobileMenuOpen(false);
      setEditingSourceId(null);
  }, [activeStudyId]);

  const handleGoToHome = () => { setIsMobileMenuOpen(false); setActiveStudyId(null); setView('landing'); };
  
  const createFolder = (name: string, parentId?: string) => { 
      const newFolder: Folder = { id: Date.now().toString(), name, parentId }; 
      setFolders([...folders, newFolder]); 
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
      
      const studiesToDelete = studies.filter(s => idsToDelete.has(s.folderId));
      studiesToDelete.forEach(s => storage.delete(s.id)); // DELETA DO STORAGE
      
      setStudies(studies.filter(s => !idsToDelete.has(s.folderId)));
      if (activeStudy?.folderId && idsToDelete.has(activeStudy.folderId)) setActiveStudyId(null);
  };
  
  const moveFolder = (folderId: string, targetParentId: string | undefined) => {
      if (folderId === targetParentId) return;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: targetParentId } : f));
  };
  
  const moveStudy = (studyId: string, targetFolderId: string) => { 
      setStudies(prev => {
          const updated = prev.map(s => s.id === studyId ? { ...s, folderId: targetFolderId } : s);
          const changed = updated.find(s => s.id === studyId);
          if (changed) storage.save(changed); // SALVA MUDANÇA
          return updated;
      });
  };

  const createStudy = (folderId: string, title: string, mode: StudyMode = selectedMode, isBook: boolean = false) => {
    const newStudy: StudySession = {
      id: Date.now().toString(), folderId, title, sources: [], mode, isBook,
      guide: null, slides: null, quiz: null, flashcards: null, createdAt: Date.now(), updatedAt: Date.now()
    };
    setStudies(prev => [newStudy, ...prev]);
    setActiveStudyId(newStudy.id);
    setActiveTab('sources');
    setSelectedMode(mode);
    storage.save(newStudy); // SALVA
    return newStudy;
  };

  const deleteStudy = (id: string) => { 
      setStudies(studies.filter(s => s.id !== id)); 
      if (activeStudyId === id) setActiveStudyId(null); 
      storage.delete(id); // DELETA
  };

  const updateStudyGuide = (studyId: string, newGuide: StudyGuide) => { 
      setStudies(prev => {
          const updated = prev.map(s => s.id === studyId ? { ...s, guide: newGuide } : s);
          const changed = updated.find(s => s.id === studyId);
          if (changed) storage.save(changed); // SALVA
          return updated;
      });
  };

  const updateStudyMode = (studyId: string, mode: StudyMode) => { 
      setStudies(prev => {
          const updated = prev.map(s => s.id === studyId ? { ...s, mode: mode } : s);
          const changed = updated.find(s => s.id === studyId);
          if (changed) storage.save(changed); // SALVA
          return updated;
      });
  };

  const handleSaveTitle = () => { 
      if (activeStudyId && editTitleInput.trim()) { 
          setStudies(prev => {
              const updated = prev.map(s => s.id === activeStudyId ? { ...s, title: editTitleInput } : s);
              const changed = updated.find(s => s.id === activeStudyId);
              if (changed) storage.save(changed); // SALVA
              return updated;
          });
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
    
    setStudies(prev => {
        const updated = prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: [...s.sources, newSource] }; return s; });
        const changed = updated.find(s => s.id === activeStudyId);
        if (changed) storage.save(changed); // SALVA
        return updated;
    });
    
    setInputText(''); setSelectedFile(null);
  };

  const removeSource = (sourceId: string) => { 
      if (!activeStudyId) return; 
      setStudies(prev => {
          const updated = prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: s.sources.filter(src => src.id !== sourceId) }; return s; });
          const changed = updated.find(s => s.id === activeStudyId);
          if (changed) storage.save(changed);
          return updated;
      });
  };

  const handleStartRenamingSource = (source: StudySource) => { setEditingSourceId(source.id); setEditSourceName(source.name); };
  
  const handleSaveSourceRename = () => { 
      if (!activeStudyId || !editingSourceId) return; 
      setStudies(prev => {
          const updated = prev.map(s => { if (s.id === activeStudyId) return { ...s, sources: s.sources.map(src => src.id === editingSourceId ? { ...src, name: editSourceName } : src) }; return s; });
          const changed = updated.find(s => s.id === activeStudyId);
          if (changed) storage.save(changed);
          return updated;
      });
      setEditingSourceId(null); setEditSourceName(''); 
  };

  const handleQuickStart = async (content: string | File, type: InputType, mode: StudyMode = StudyMode.NORMAL, autoGenerate: boolean = false, isBook: boolean = false) => {
    let targetFolderId = 'root-neuro';
    if (isBook) targetFolderId = 'root-books';
    else if (mode === StudyMode.PARETO) targetFolderId = 'root-pareto';

    const fileName = content instanceof File ? content.name : 'Novo Estudo';
    let title = isBook ? `Livro: ${fileName}` : mode === StudyMode.PARETO ? `Pareto 80/20: ${fileName}` : `Estudo: ${fileName}`;
    
    const newStudy = createStudy(targetFolderId, title, mode, isBook);

    let sourceContent = ''; let mimeType = 'text/plain'; let name = '';
    if (content instanceof File) { sourceContent = await fileToBase64(content); mimeType = content.type; name = content.name; } 
    else { sourceContent = content; if (type === InputType.DOI) name = 'DOI Link'; else if (type === InputType.URL) name = 'Website Link'; else name = 'Texto Colado'; }

    const newSource: StudySource = { id: Date.now().toString(), type, name, content: sourceContent, mimeType, dateAdded: Date.now() };
    
    setStudies(prev => {
        const updated = prev.map(s => { if (s.id === newStudy.id) return { ...s, sources: [newSource] }; return s; });
        const changed = updated.find(s => s.id === newStudy.id);
        if (changed) storage.save(changed);
        return updated;
    });

    setQuickInputMode('none'); setInputText(''); setView('app');
    if (autoGenerate) { setTimeout(() => handleGenerateGuideForStudy(newStudy.id, newSource, mode, isBook), 100); }
  };

  const handleParetoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          let type = InputType.TEXT;
          if (file.type.includes('pdf')) type = InputType.PDF;
          else if (file.name.endsWith('.epub')) type = InputType.EPUB;
          else if (file.name.endsWith('.mobi')) type = InputType.MOBI;
          else if (file.type.includes('video') || file.type.includes('audio')) type = InputType.VIDEO;
          else if (file.type.includes('image')) type = InputType.IMAGE;
          handleQuickStart(file, type, StudyMode.PARETO, true, false); 
      }
  };

  const handleBookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          let type = InputType.PDF;
          if (file.name.endsWith('.epub')) type = InputType.EPUB;
          if (file.name.endsWith('.mobi')) type = InputType.MOBI;
          handleQuickStart(file, type, StudyMode.NORMAL, false, true); 
      }
  };

  const fileToBase64 = (file: File): Promise<string> => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { const result = reader.result as string; const base64 = result.split(',')[1]; resolve(base64); }; reader.onerror = (error) => reject(error); }); };

  const handleGenerateGuideForStudy = async (studyId: string, source: StudySource, mode: StudyMode, isBook: boolean) => {
    const isBinary = source.type === InputType.PDF || source.type === InputType.VIDEO || source.type === InputType.IMAGE || source.type === InputType.EPUB || source.type === InputType.MOBI;
    const isVideo = source.type === InputType.VIDEO;
    setProcessingState({ isLoading: true, error: null, step: isVideo ? 'transcribing' : 'analyzing' });
    try {
        const progressTimer = setTimeout(() => { setProcessingState(prev => ({ ...prev, step: 'generating' })); }, 3500);
        const guide = await generateStudyGuide(source.content, source.mimeType || 'text/plain', mode, isBinary, isBook);
        clearTimeout(progressTimer);
        
        setStudies(prev => {
            const updated = prev.map(s => s.id === studyId ? { ...s, guide } : s);
            const changed = updated.find(s => s.id === studyId);
            if (changed) storage.save(changed); // SALVA
            return updated;
        });

        setProcessingState({ isLoading: false, error: null, step: 'idle' });
        setActiveTab('guide');
    } catch (err: any) { setProcessingState({ isLoading: false, error: err.message, step: 'idle' }); }
  };

  const handleGenerateGuide = async () => {
    if (!activeStudy || activeStudy.sources.length === 0) return;
    const source = activeStudy.sources[activeStudy.sources.length - 1]; 
    handleGenerateGuideForStudy(activeStudy.id, source, activeStudy.mode, activeStudy.isBook || false);
  };

  // ... (Handlers placeholders)
  const handleGenerateSlides = async () => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'slides' }); try { const slides = await generateSlides(activeStudy.guide); setStudies(prev => { const updated = prev.map(s => s.id === activeStudyId ? { ...s, slides } : s); const changed = updated.find(s => s.id === activeStudyId); if (changed) storage.save(changed); return updated; }); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleGenerateQuiz = async (config?: any) => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'quiz' }); try { const quiz = await generateQuiz(activeStudy.guide, activeStudy.mode || StudyMode.NORMAL, config); setStudies(prev => { const updated = prev.map(s => s.id === activeStudyId ? { ...s, quiz } : s); const changed = updated.find(s => s.id === activeStudyId); if (changed) storage.save(changed); return updated; }); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleGenerateFlashcards = async () => { if (!activeStudy?.guide) return; setProcessingState({ isLoading: true, error: null, step: 'flashcards' }); try { const flashcards = await generateFlashcards(activeStudy.guide); setStudies(prev => { const updated = prev.map(s => s.id === activeStudyId ? { ...s, flashcards } : s); const changed = updated.find(s => s.id === activeStudyId); if (changed) storage.save(changed); return updated; }); } catch (err: any) { setProcessingState(prev => ({ ...prev, error: err.message })); } finally { setProcessingState(prev => ({ ...prev, isLoading: false, step: 'idle' })); } };
  const handleClearQuiz = () => { if (!activeStudyId) return; setStudies(prev => { const updated = prev.map(s => s.id === activeStudyId ? { ...s, quiz: null } : s); const changed = updated.find(s => s.id === activeStudyId); if (changed) storage.save(changed); return updated; }); };
  const handleStartSession = () => { createStudy('root-neuro', `Novo Estudo`, selectedMode); };
  const handleFolderExam = (fid: string) => { /* ... */ };
  const renderSourceDescription = (t: InputType) => { /* ... */ return null; };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 mb-6">Esta plataforma está em fase de testes fechados. Por favor, insira a senha de acesso.</p>
          <input type="password" placeholder="Senha de acesso" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-4" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoFocus />
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Entrar</button>
        </div>
      </div>
    );
  }

  // (Landing Page View igual ao anterior)
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <header className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
                <NeuroLogo size={40} className="text-indigo-600" />
                <span className="font-extrabold text-slate-900 tracking-tight text-xl">NeuroStudy</span>
            </div>
            <button onClick={() => setView('app')} className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors">Entrar no Painel →</button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-4">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest border border-indigo-100">Neurociência Aplicada</span>
                    <div className="flex justify-center mb-8"><NeuroLogo size={130} className="drop-shadow-2xl" /></div>
                    <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">Pare de estudar.<br/><span className="text-indigo-600">Comece a aprender.</span></h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Transforme PDFs, Vídeos e Anotações em guias de estudo ativo.</p>
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
            <div className="mt-2"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">Versão Beta</span></div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden animate-in fade-in duration-500">
      <Sidebar folders={folders} studies={studies} activeStudyId={activeStudyId} onSelectStudy={setActiveStudyId} onCreateFolder={createFolder} onRenameFolder={renameFolder} onCreateStudy={createStudy} onDeleteStudy={deleteStudy} onDeleteFolder={deleteFolder} onMoveFolder={moveFolder} onMoveStudy={moveStudy} onOpenMethodology={() => setShowMethodologyModal(true)} onFolderExam={handleFolderExam} onGoToHome={handleGoToHome} />
      
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
            ) : ( <h1 className="text-xl font-bold text-gray-400 flex items-center gap-2"><NeuroLogo size={24} className="grayscale opacity-50"/> Criar Novo Estudo</h1> )}
          </div>
          <div className="flex items-center gap-3">
             {activeStudy && (
                 <>
                    <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setShowNotifications(!showNotifications)}><Bell className="w-5 h-5"/>{dueReviewsCount > 0 && (<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>)}</button>
                    {showNotifications && (<><div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div><NotificationCenter studies={studies} onSelectStudy={setActiveStudyId} onClose={() => setShowNotifications(false)} /></>)}
                    <button onClick={() => setShowReviewScheduler(true)} className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"><Calendar className="w-4 h-4"/> Agendar Revisão</button>
                 </>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 scroll-smooth">
          {activeStudy ? (
            processingState.isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[500px]">
                    <ProcessingStatus step={processingState.step} size="large" />
                </div>
            ) : (
            activeStudy.isBook && !activeStudy.guide ? (
               <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                   <div className="text-center mb-8">
                       <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-orange-200">
                           <BookOpen className="w-10 h-10"/>
                       </div>
                       <h2 className="text-3xl font-bold text-gray-900 mb-2">Configurar Resumo do Livro</h2>
                       <p className="text-gray-500 max-w-md mx-auto">Selecione o nível de profundidade que deseja para a análise desta obra.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full px-4">
                       <button onClick={() => updateStudyMode(activeStudy.id, StudyMode.SURVIVAL)} className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 ${activeStudy.mode === StudyMode.SURVIVAL ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-300' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                           <div className="flex items-center gap-3 mb-3">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500"><BatteryCharging className="w-6 h-6"/></div>
                               <h3 className="font-bold text-gray-900">Sobrevivência</h3>
                           </div>
                           <p className="text-xs text-gray-600 leading-relaxed mb-2 font-semibold">Foco Absoluto (20/80)</p>
                           <p className="text-xs text-gray-500 leading-relaxed">Analisa a obra inteira de uma vez para extrair apenas a tese central e os pilares globais. Ideal para ter uma visão geral em 5 minutos.</p>
                       </button>

                       <button onClick={() => updateStudyMode(activeStudy.id, StudyMode.NORMAL)} className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 ${activeStudy.mode === StudyMode.NORMAL ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-300' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                           <div className="flex items-center gap-3 mb-3">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500"><Activity className="w-6 h-6"/></div>
                               <h3 className="font-bold text-gray-900">Normal</h3>
                           </div>
                           <p className="text-xs text-gray-600 leading-relaxed mb-2 font-semibold">Capítulo a Capítulo</p>
                           <p className="text-xs text-gray-500 leading-relaxed">Aplica o princípio de Pareto individualmente em cada capítulo. Extrai os conceitos chave e a aplicação prática de cada parte.</p>
                       </button>

                       <button onClick={() => updateStudyMode(activeStudy.id, StudyMode.HARD)} className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 ${activeStudy.mode === StudyMode.HARD ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-300' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                           <div className="flex items-center gap-3 mb-3">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500"><Rocket className="w-6 h-6"/></div>
                               <h3 className="font-bold text-gray-900">Hard</h3>
                           </div>
                           <p className="text-xs text-gray-600 leading-relaxed mb-2 font-semibold">Deep Dive (Profundo)</p>
                           <p className="text-xs text-gray-500 leading-relaxed">Resumo detalhado e hierárquico, analisando seção por seção. Inclui mapa de conexões, checklists e análise profunda.</p>
                       </button>
                   </div>

                   <button onClick={handleGenerateGuide} className="mt-8 bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 hover:-translate-y-1 transition-all flex items-center gap-2">
                       <Play className="w-5 h-5 fill-current" />
                       Gerar
