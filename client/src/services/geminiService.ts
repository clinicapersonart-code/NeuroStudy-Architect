import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyGuide, ChatMessage, Slide, QuizQuestion, Flashcard, StudyMode } from "../types";

const getApiKey = (): string | undefined => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
};

// --- CONFIGURATION ---
// Switched to 1.5-flash for better stability with free keys
const MODEL_NAME = 'gemini-1.5-flash'; 

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    overview: { type: Type.STRING },
    globalApplication: { type: Type.STRING },
    coreConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ["concept", "definition"],
      },
    },
    checkpoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          mission: { type: Type.STRING },
          timestamp: { type: Type.STRING },
          lookFor: { type: Type.STRING },
          noteExactly: { type: Type.STRING },
          drawExactly: { type: Type.STRING },
          drawLabel: { type: Type.STRING, enum: ["essential", "suggestion", "none"] },
          question: { type: Type.STRING },
        },
        required: ["mission", "timestamp", "lookFor", "noteExactly", "question"],
      },
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          practicalApplication: { type: Type.STRING },
          coreConcepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { concept: { type: Type.STRING }, definition: { type: Type.STRING } },
              required: ["concept", "definition"]
            }
          },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                coreConcepts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { concept: { type: Type.STRING }, definition: { type: Type.STRING } },
                    required: ["concept", "definition"]
                  }
                }
              },
              required: ["title", "coreConcepts"]
            }
          }
        },
        required: ["title", "summary", "coreConcepts"]
      }
    }
  },
  required: ["subject", "overview", "coreConcepts", "checkpoints"],
};

export const generateStudyGuide = async (
  content: string,
  mimeType: string,
  mode: StudyMode = StudyMode.NORMAL,
  isBinary: boolean = false,
  isBook: boolean = false
): Promise<StudyGuide> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("CRITICAL: API Key is missing. Check your .env file.");
    throw new Error("Chave de API não encontrada (VITE_GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });

  let modeInstructions = "";

  if (isBook) {
    switch (mode) {
      case StudyMode.SURVIVAL:
        modeInstructions = `
        MODO LIVRO: SOBREVIVÊNCIA (Pareto Global 80/20)
        - LÓGICA: Analisar o livro INTEIRO como uma unidade.
        - OBJETIVO: Extrair apenas o núcleo vital (20%) que entrega 80% do valor.
        - ESTRUTURA:
          * Visão Geral Global: Sinopse densa.
          * Conceitos CORE: Os pilares fundamentais do livro todo.
          * Aplicação Prática: Como usar a ideia central.
          * Checkpoints: Crie 1 ou 2 apenas para os pontos cruciais (opcional).
          * Chapters Array: Pode ser simplificado.
        `;
        break;
      case StudyMode.HARD:
        modeInstructions = `
        MODO LIVRO: HARD (Análise Profunda por Seção)
        - LÓGICA: Resumo exaustivo e hierárquico.
        - ESTRUTURA:
          * Para CADA CAPÍTULO: Resumo detalhado + Conceitos Core + Conceitos Suporte.
          * Para CADA SEÇÃO PRINCIPAL (dentro do array 'chapters' -> 'sections'): Extraia conceitos específicos.
          * Checkpoints: Crie uma trilha de leitura detalhada.
        `;
        break;
      case StudyMode.NORMAL:
      default:
        modeInstructions = `
        MODO LIVRO: NORMAL (Pareto por Capítulo)
        - LÓGICA: Aplicar Pareto individualmente em cada capítulo.
        - ESTRUTURA:
          * Para CADA CAPÍTULO (preencha o array 'chapters'):
            - Nome
            - Conceitos CORE (20% essenciais daquele capítulo)
            - Aplicação Prática do Capítulo
          * Checkpoints: Crie checkpoints focados nos "Grandes Insights" de cada capítulo principal.
        `;
        break;
    }
  } else {
    if (mode === StudyMode.HARD) {
      modeInstructions = `
      MODO: TURBO 🚀 (Análise Completa e Detalhada)
      OBJETIVO: Extração máxima de conhecimento. Pareto INVERTIDO (95-100% do conteúdo).
      CHECKPOINTS: Alta granularidade (micro-checkpoints de 2-4 min).
      PROFUNDIDADE: Definições completas, contexto, nuances.
      `;
    } else if (mode === StudyMode.SURVIVAL) {
      modeInstructions = `
      MODO: SOBREVIVÊNCIA ⚡ (Pareto 80/20 Absoluto)
      OBJETIVO: Apenas o essencial. Pareto RIGOROSO.
      CHECKPOINTS: Macro-checkpoints (3-5 no total).
      PROFUNDIDADE: Frases-chave, sem detalhes.
      `;
    } else if (mode === StudyMode.PARETO) {
      modeInstructions = `
      MODO: PARETO 80/20 (Extração Rápida - Landing Page).
      OBJETIVO: Leitura e resumo executivo.
      CHECKPOINTS: Array vazio []. NÃO GERE CHECKPOINTS.
      OVERVIEW: Um resumo denso e rico em Markdown.
      `;
    } else {
      modeInstructions = `
      MODO: NORMAL 📚 (Pareto + Contexto)
      OBJETIVO: Equilíbrio (50% do conteúdo, 90% do valor).
      CHECKPOINTS: Granularidade média (5-7 min).
      `;
    }
  }

  const MASTER_PROMPT = `
  Você é o NeuroStudy Architect.
  CONTEXTO: O usuário enviou um conteúdo (${isBook ? 'LIVRO COMPLETO' : 'Material de Estudo'}) para processamento.
  
  SUA MISSÃO:
  1. Ler e interpretar o conteúdo.
  2. Aplicar a estratégia: ${modeInstructions}
  3. Gerar JSON estrito seguindo o schema.

  IDIOMA: Português do Brasil (pt-BR).
  `;

  const parts: any[] = [];
  if (isBinary) {
     parts.push({ inlineData: { mimeType: mimeType, data: content } });
     parts.push({ text: "Gere o roteiro de aprendizado." });
  } else {
     parts.push({ text: content });
  }

  try {
    console.log(`[Gemini] Requesting generation with model: ${MODEL_NAME}`);
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: MASTER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.3,
      },
    });

    console.log("[Gemini] Response received");

    let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const guide = JSON.parse(cleanText) as StudyGuide;
    
    if (guide.checkpoints) {
        guide.checkpoints = guide.checkpoints.map(cp => ({ ...cp, completed: false }));
    }
    return guide;
  } catch (error) {
    console.error("[Gemini] Error generating study guide:", error);
    throw error;
  }
};

export const generateSlides = async (guide: StudyGuide): Promise<Slide[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: `Crie Slides JSON sobre: "${guide.subject}".` }] },
          config: { responseMimeType: "application/json" }
      });
      
      let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text || "[]");
    } catch (error) {
      console.error("[Gemini] Error generating slides:", error);
      return [];
    }
};

export const generateQuiz = async (guide: StudyGuide, mode: StudyMode, config?: any): Promise<QuizQuestion[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const prompt = `Crie um Quiz JSON com ${config?.quantity || 6} perguntas sobre ${guide.subject}.`;
      const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: prompt }] },
          config: { responseMimeType: "application/json" }
      });
      let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text || "[]");
    } catch (error) {
      console.error("[Gemini] Error generating quiz:", error);
      return [];
    }
};

export const generateFlashcards = async (guide: StudyGuide): Promise<Flashcard[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: `Crie Flashcards JSON sobre: ${guide.subject}.` }] },
          config: { responseMimeType: "application/json" }
      });
      let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text || "[]");
    } catch (error) {
      console.error("[Gemini] Error generating flashcards:", error);
      return [];
    }
};

export const sendChatMessage = async (history: ChatMessage[], msg: string, studyGuide: StudyGuide | null = null): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de API Key.";
    const ai = new GoogleGenAI({ apiKey });
    let systemInstruction = "Você é um Mentor de Aprendizado.";
    if (studyGuide) systemInstruction += ` O usuário estuda: ${studyGuide.subject}.`;
    
    try {
      const chat = ai.chats.create({ 
          model: MODEL_NAME, 
          history: history.slice(-5).map(m=>({role:m.role, parts:[{text:m.text}]})),
          config: { systemInstruction }
      });
      const res = await chat.sendMessage({ message: msg });
      return res.text || "";
    } catch (error) {
      console.error("[Gemini] Chat error:", error);
      return "Erro ao conectar com o professor virtual.";
    }
};

export const refineContent = async (text: string, task: string): Promise<string> => { 
    const apiKey = getApiKey();
    if (!apiKey) return "Erro.";
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({ 
          model: MODEL_NAME, 
          contents: { parts: [{ text: `Melhore este texto (${task}): "${text}"` }] } 
      });
      const raw = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
      return raw || "";
    } catch (error) {
      console.error("[Gemini] Refine content error:", error);
      return text;
    }
};

export const generateDiagram = async (desc: string): Promise<string> => { return ""; };
