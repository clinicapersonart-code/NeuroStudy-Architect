import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyGuide, ChatMessage, Slide, QuizQuestion, Flashcard, StudyMode, InputType } from "../types";

// Função para pegar a chave com segurança no Vite
const getApiKey = (): string | undefined => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    overview: { type: Type.STRING },
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
  },
  required: ["subject", "overview", "coreConcepts", "checkpoints"],
};

export const generateStudyGuide = async (
  content: string,
  mimeType: string,
  mode: StudyMode = StudyMode.NORMAL,
  isBinary: boolean = false
): Promise<StudyGuide> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chave de API não encontrada (VITE_GEMINI_API_KEY).");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.0-flash'; // Rápido, inteligente e estável

  // --- ENGENHARIA DE PROMPT (MENTALIDADE DE MESTRIA) ---
  let modeInstructions = "";
  
  switch (mode) {
    case StudyMode.HARD:
      modeInstructions = `
      MODO: HARD (Especialista Técnico / Detalhista).
      - FILOSOFIA: "O diabo mora nos detalhes."
      - OBJETIVO: Dominar cada nuance, exceção e complexidade do conteúdo.
      - ESTRUTURA: Quebre o conteúdo em micro-passos. Se houver dados técnicos, fórmulas ou processos complexos, crie um checkpoint específico para eles.
      - PERGUNTAS: Devem ser desafiadoras, exigindo análise crítica e conexão de ideias.
      - PÚBLICO: Alguém que precisa se tornar um expert no assunto.
      `;
      break;
      
    case StudyMode.SURVIVAL:
      modeInstructions = `
      MODO: SOBREVIVÊNCIA (Essencialismo / 80-20).
      - FILOSOFIA: "Feito é melhor que perfeito. O que é vital?"
      - OBJETIVO: Entender a estrutura geral e os pontos críticos o mais rápido possível.
      - ESTRUTURA: Agrupe o conteúdo em 2 ou 3 grandes blocos lógicos. Ignore curiosidades ou aprofundamentos teóricos.
      - PERGUNTAS: Focadas no básico inegociável (o que faria o aluno falhar se não soubesse).
      - PÚBLICO: Alguém com pressa ou revisando antes da prática.
      `;
      break;
      
    case StudyMode.PARETO:
      modeInstructions = `
      MODO: PARETO 80/20 (Extração de Conhecimento).
      - OBJETIVO: Leitura e resumo executivo.
      - CHECKPOINTS: Array vazio [].
      - OVERVIEW: Um resumo denso, rico e bem formatado em Markdown.
      `;
      break;
      
    case StudyMode.NORMAL:
    default:
      modeInstructions = `
      MODO: NORMAL (Domínio Completo e Aprendizado Sólido).
      - FILOSOFIA: "Entender para aplicar. Absorção máxima."
      - OBJETIVO: Construir uma compreensão robusta que permita ao aluno explicar o assunto para outros.
      - ESTRUTURA: Crie uma narrativa de aprendizado.
        1. Comece pelos Fundamentos (O que é e Por que existe?).
        2. Avance para o Mecanismo (Como funciona na prática?).
        3. Termine com a Aplicação/Consequência (Como usar/Impactos reais).
      - CHECKPOINTS: Crie entre 4 a 6 sessões de estudo. Evite ser raso. Se o texto for curto, expanda a análise pedindo para o aluno refletir sobre as implicações.
      - PÚBLICO: Estudantes, profissionais e aprendizes que buscam competência real.
      `;
      break;
  }

  const MASTER_PROMPT = `
  Você é o NeuroStudy Architect, um Mentor de Aprendizado de Alta Performance.
  
  CONTEXTO:
  O usuário enviou um material (pode ser técnico, acadêmico, prático ou teórico) e quer absorver o conhecimento contido nele.
  
  SUA MISSÃO:
  1. Ler e interpretar o conteúdo com profundidade.
  2. Aplicar a estratégia do modo selecionado: ${modeInstructions}
  3. Gerar um roteiro prático e acionável em JSON.

  DIRETRIZES DE CHECKPOINT (A Jornada do Usuário):
  - 'mission': Uma ordem direta e clara (ex: "Desconstrua o conceito X", "Analise o processo Y").
  - 'lookFor': Onde está a informação chave no material.
  - 'noteExactly': O "insight de ouro". A frase ou dado que resume a essência daquele bloco.
  - 'question': Uma pergunta de "Active Recall" (Verificação) para garantir que ele entendeu, não apenas leu.

  DIRETRIZES VISUAIS:
  - Se o texto descrever processos, ciclos ou hierarquias, sugira um desenho em 'drawExactly'. Visualização ajuda a memória.

  IDIOMA: Português do Brasil (pt-BR) 🇧🇷. Use uma linguagem clara, didática e profissional.
  `;

  const parts: any[] = [];
  
  if (isBinary) {
     parts.push({ inlineData: { mimeType: mimeType, data: content } });
     parts.push({ text: "Analise este arquivo e gere o roteiro de aprendizado." });
  } else {
     parts.push({ text: content });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: MASTER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.35, // Equilíbrio entre precisão e fluidez didática
      },
    });

    let text = "";
    if (typeof (response as any).text === 'function') {
        text = (response as any).text();
    } else if ((response as any).text) {
        text = (response as any).text;
    } else {
        text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!text) throw new Error("Sem resposta da IA.");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const guide = JSON.parse(cleanText) as StudyGuide;
    
    if (guide.checkpoints) {
        guide.checkpoints = guide.checkpoints.map(cp => ({ ...cp, completed: false }));
    }
    return guide;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateSlides = async (guide: StudyGuide): Promise<Slide[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { parts: [{ text: `
        Crie uma estrutura de aula (Slides JSON) sobre: "${guide.subject}".
        Baseado no resumo: "${guide.overview}".
        Objetivo: Ensinar o conteúdo de forma didática e envolvente.
        Saída: Lista JSON de slides com 'title', 'bullets' e 'speakerNotes'.
        ` }] },
        config: { responseMimeType: "application/json" }
    });
    
    let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text || "[]");
};

export const generateQuiz = async (guide: StudyGuide, mode: StudyMode, config?: any): Promise<QuizQuestion[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    // Nível adaptativo
    let levelContext = "Perguntas equilibradas para testar compreensão e aplicação.";
    if (mode === StudyMode.HARD) levelContext = "Perguntas desafiadoras, exigindo análise crítica e conexão de conceitos.";
    if (mode === StudyMode.SURVIVAL) levelContext = "Perguntas fundamentais sobre os conceitos principais.";

    const prompt = `
    Crie um Quiz JSON com ${config?.quantity || 6} perguntas sobre ${guide.subject}.
    Contexto: ${levelContext}
    Conceitos chave: ${guide.coreConcepts.map(c => c.concept).join(', ')}.
    Idioma: Português do Brasil.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });
    
    let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text || "[]");
};

export const generateFlashcards = async (guide: StudyGuide): Promise<Flashcard[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { parts: [{ text: `Crie Flashcards JSON (Frente/Verso) para memorização ativa e retenção de longo prazo sobre: ${guide.subject}.` }] },
        config: { responseMimeType: "application/json" }
    });
    
    let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text || "[]");
};

export const sendChatMessage = async (history: ChatMessage[], msg: string, studyGuide: StudyGuide | null = null): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de API Key.";
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = "Você é um Mentor de Aprendizado. Ajude o usuário a aprofundar seu conhecimento, tire dúvidas e dê exemplos práticos.";
    if (studyGuide) {
        systemInstruction += ` O usuário está estudando: ${studyGuide.subject}. Use este resumo como base: ${studyGuide.overview}`;
    }

    const chat = ai.chats.create({ 
        model: 'gemini-2.0-flash', 
        history: history.slice(-5).map(m=>({role:m.role, parts:[{text:m.text}]})),
        config: { systemInstruction }
    });
    
    const res = await chat.sendMessage({ message: msg });
    return res.text || "";
};

export const refineContent = async (text: string, task: string): Promise<string> => { 
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de API Key.";
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
    Atue como um especialista em comunicação e didática.
    Tarefa: ${task}.
    Conteúdo Original: "${text}"
    Objetivo: Tornar o conteúdo mais claro, memorável ou prático (conforme a tarefa).
    Idioma: Português do Brasil.
    `;

    const response = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash', 
        contents: { parts: [{ text: prompt }] } 
    });
    const raw = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    return raw || "";
};

export const generateDiagram = async (desc: string): Promise<string> => { return ""; };