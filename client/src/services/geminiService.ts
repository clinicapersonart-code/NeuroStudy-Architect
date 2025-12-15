import { GoogleGenAI, Schema, Type } from "@google/genai";
import { StudyGuide, ChatMessage, Slide, QuizQuestion, Flashcard, StudyMode } from "../types";

const getApiKey = (): string | undefined => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
};

// --- SELETOR DE CÉREBRO ---
const getModelName = () => {
  const isPro = localStorage.getItem('neurostudy_auth') === 'true';
  return isPro ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
};

// ... MANTENHA O RESPONSE_SCHEMA IGUAL ...
// (Para economizar espaço, não vou colar o schema gigante de novo, mas não apague ele do seu arquivo!)
// Copie apenas a função generateStudyGuide para baixo:

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    overview: { type: Type.STRING },
    globalApplication: { type: Type.STRING },
    coreConcepts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { concept: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["concept", "definition"] } },
    checkpoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { mission: { type: Type.STRING }, timestamp: { type: Type.STRING }, lookFor: { type: Type.STRING }, noteExactly: { type: Type.STRING }, drawExactly: { type: Type.STRING }, drawLabel: { type: Type.STRING, enum: ["essential", "suggestion", "none"] }, question: { type: Type.STRING } }, required: ["mission", "timestamp", "lookFor", "noteExactly", "question"] } },
    chapters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, practicalApplication: { type: Type.STRING }, coreConcepts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { concept: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["concept", "definition"] } }, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, coreConcepts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { concept: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["concept", "definition"] } } }, required: ["title", "coreConcepts"] } } }, required: ["title", "summary", "coreConcepts"] } }
  },
  required: ["subject", "overview", "coreConcepts", "checkpoints"],
};

export const generateStudyGuide = async (content: string, mimeType: string, mode: StudyMode = StudyMode.NORMAL, isBinary: boolean = false, isBook: boolean = false): Promise<StudyGuide> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getModelName(); // <--- MODELO DINÂMICO
  console.log(`🧠 Usando modelo: ${modelName}`);

  let modeInstructions = "";
  if (isBook) {
      if(mode === StudyMode.SURVIVAL) modeInstructions = "MODO LIVRO SOBREVIVÊNCIA: Foco 80/20 global.";
      else if(mode === StudyMode.HARD) modeInstructions = "MODO LIVRO HARD: Análise profunda por seção.";
      else modeInstructions = "MODO LIVRO NORMAL: Resumo capítulo a capítulo.";
  } else {
      if(mode === StudyMode.PARETO) modeInstructions = "MODO PARETO: Resumo executivo sem checkpoints.";
      else modeInstructions = "MODO ESTUDO: Crie checkpoints de aprendizado ativo.";
  }

  const MASTER_PROMPT = `Você é o NeuroStudy Architect. Analise o conteúdo e gere JSON estrito.\nEstratégia: ${modeInstructions}`;

  const parts: any[] = [];
  if (isBinary) {
     parts.push({ inlineData: { mimeType: mimeType, data: content } });
     parts.push({ text: "Gere o roteiro." });
  } else {
     parts.push({ text: content });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { role: 'user', parts: parts },
    config: { systemInstruction: MASTER_PROMPT, responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });

  let text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim()) as StudyGuide;
};

// Funções auxiliares (ATUALIZADAS)
export const generateSlides = async (guide: StudyGuide): Promise<Slide[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });
    const res = await ai.models.generateContent({ model: getModelName(), contents: { parts: [{ text: `Slides JSON para: ${guide.subject}` }] }, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
};

export const generateQuiz = async (guide: StudyGuide, mode: StudyMode, config?: any): Promise<QuizQuestion[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });
    const res = await ai.models.generateContent({ model: getModelName(), contents: { parts: [{ text: `Quiz JSON 6 perguntas sobre: ${guide.subject}` }] }, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
};

export const generateFlashcards = async (guide: StudyGuide): Promise<Flashcard[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });
    const res = await ai.models.generateContent({ model: getModelName(), contents: { parts: [{ text: `Flashcards JSON sobre: ${guide.subject}` }] }, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
};

export const sendChatMessage = async (history: ChatMessage[], msg: string, studyGuide: StudyGuide | null = null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });
    const chat = ai.chats.create({ model: getModelName(), history: history.slice(-5).map(m=>({role:m.role, parts:[{text:m.text}]})) });
    const res = await chat.sendMessage({ message: msg });
    return res.text || "";
};

export const refineContent = async (text: string, task: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });
    const res = await ai.models.generateContent({ model: getModelName(), contents: { parts: [{ text: `Melhore (${task}): "${text}"` }] } });
    return res.text || "";
};

export const generateDiagram = async (desc: string): Promise<string> => { return ""; };
