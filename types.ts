export enum InputType {
  TEXT = 'TEXT',
  PDF = 'PDF',
  URL = 'URL',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOI = 'DOI',
  EPUB = 'EPUB',
  MOBI = 'MOBI'
}

export enum StudyMode {
  SURVIVAL = 'SURVIVAL', // Resumo extremo (1 frase/capítulo)
  NORMAL = 'NORMAL',     // Pareto 80/20
  HARD = 'HARD',         // Completo e Profundo
  PARETO = 'PARETO'      // Modo focado apenas no essencial
}

export interface CoreConcept {
  concept: string;
  definition: string;
  // Adicionamos isto para guardar o Feynman/Exemplo dentro do conceito
  tools?: {
    feynman?: string;
    example?: string;
  };
}

export interface Checkpoint {
  id: string;
  mission: string;
  timestamp: string;
  lookFor: string;
  noteExactly: string;
  question: string;
  completed?: boolean;
}

export interface StudyGuide {
  subject: string;
  title: string; // Título gerado ou extraído
  overview: string;
  globalApplication?: string; // Aplicação prática global
  mainConcepts: CoreConcept[]; // Para artigos/vídeos
  bookChapters?: {             // Para livros
      title: string;
      summary: string;
      keyPoints: string[];
      actionableStep?: string;
      coreConcepts?: CoreConcept[]; // Conceitos específicos do capítulo
  }[]; 
  supportConcepts?: CoreConcept[]; // Conceitos de base (glossário)
  checkpoints?: Checkpoint[];
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  
  // Ferramentas Globais
  diagramUrl?: string;
  tools?: {
      mnemonics?: string;
      interdisciplinary?: string;
      realWorldApplication?: string; // Aplicação global
      explainLikeIm5?: string;       // Explicação global
  };
}

export interface StudySession {
  id: string;
  folderId: string;
  title: string;
  sources: StudySource[];
  mode: StudyMode;
  isBook?: boolean;
  
  guide: StudyGuide | null;
  slides: SlideContent[] | null;
  quiz: QuizQuestion[] | null;
  flashcards: Flashcard[] | null;
  
  createdAt: number;
  updatedAt: number;
  nextReviewDate?: number;
  reviewStep?: number; // 0, 1, 2, 3...
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

export interface StudySource {
  id: string;
  type: InputType;
  name: string;
  content: string; // Texto ou Base64
  mimeType?: string;
  dateAdded: number;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  step: 'idle' | 'transcribing' | 'analyzing' | 'generating' | 'slides' | 'quiz' | 'flashcards';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SlideContent {
  title: string;
  bullets: string[];
  speakerNotes: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}
