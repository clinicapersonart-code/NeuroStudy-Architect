export enum InputType {
  TEXT = 'TEXT',
  PDF = 'PDF',
  YOUTUBE = 'YOUTUBE', // Mantendo compatibilidade
  VIDEO = 'VIDEO',
  URL = 'URL',
  DOI = 'DOI',
  IMAGE = 'IMAGE',
  EPUB = 'EPUB',
  MOBI = 'MOBI'
}

export enum StudyMode {
  SURVIVAL = 'SURVIVAL',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  PARETO = 'PARETO'
}

export interface Checkpoint {
  id: string;
  task: string;
  completed: boolean;
}

export interface StudySource {
  id: string;
  type: InputType;
  name: string;
  content: string; // Text content or base64
  mimeType?: string;
  dateAdded: number;
}

export interface BookChapter {
    title: string;
    summary: string;
    keyPoints: string[];
    actionableStep?: string;
    supportConcepts?: { concept: string; explanation: string }[];
}

export interface StudyGuide {
  title: string;
  summary: string;
  mainConcepts: { concept: string; explanation: string }[];
  bookChapters?: BookChapter[]; 
  checkpoints?: Checkpoint[];
  tools?: {
    explainLikeIm5?: string;
    analogy?: string;
    realWorldApplication?: string;
    mnemonics?: string;
    interdisciplinary?: string;
  };
  quiz?: any;
  diagramUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  nextReview?: number;
}

export interface SlideContent {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
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
  reviewStep?: number; // 0 = Nunca revisou, 1 = Revisou 1 vez (24h), etc.
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  step: 'idle' | 'uploading' | 'analyzing' | 'generating' | 'slides' | 'quiz' | 'flashcards' | 'transcribing';
}
