import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyGuide, ChatMessage, Slide, QuizQuestion, Flashcard, StudyMode } from "../types";

const getApiKey = (): string | undefined => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
};

// --- CONFIGURAÇÃO ---
const MODEL_NAME = 'gemini-2.0-flash'; // Modelo rápido e com visão

// Schemas (Mantidos iguais ao anterior)
const COMMON_PROPERTIES = {
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
  supportConcepts: {
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
  }
};

const CHAPTERS_PROPERTY = {
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
};

// --- FUNÇÃO AUXILIAR: UPLOAD DE ARQUIVO (FILE API) ---
// Faz upload do arquivo para o Google e retorna a URI
async function uploadFileToGemini(base64Data: string, mimeType: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  // 1. Converter Base64 de volta para Blob (necessário para upload)
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // 2. Iniciar Upload Resumível (Resumable Upload)
  // Nota: Estamos usando fetch direto porque a SDK às vezes tem bugs em ambientes browser-only
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const initialResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': blob.size.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'User Upload' } })
  });

  const uploadHeader = initialResponse.headers.get('x-goog-upload-url');
  if (!uploadHeader) throw new Error("Falha ao iniciar upload no Google AI.");

  // 3. Enviar os dados
  const uploadResponse = await fetch(uploadHeader, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Length': blob.size.toString(),
    },
    body: blob
  });

  const uploadResult = await uploadResponse.json();
  const fileUri = uploadResult.file.uri;
  
  console.log("Arquivo enviado para Google AI:", fileUri);
  return fileUri;
}

// --- RETRY LOGIC ---
async function fetchWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 5000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if ((error.status === 429 || error.message?.includes('429') || error.status === 503) && retries > 0) {
      console.warn(`[Gemini] Limite (429). Aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateStudyGuide = async (
  content: string,
  mimeType: string,
  mode: StudyMode = StudyMode.NORMAL,
  isBinary: boolean = false,
  isBook: boolean = false
): Promise<StudyGuide> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const schemaProperties = isBook ? { ...COMMON_PROPERTIES, ...CHAPTERS_PROPERTY } : { ...COMMON_PROPERTIES };
  const finalSchema: Schema = {
    type: Type.OBJECT,
    properties: schemaProperties,
    required: ["subject", "overview", "coreConcepts", "checkpoints"],
  };

  let modeInstructions = "";
  if (isBook) {
    switch (mode) {
      case StudyMode.SURVIVAL:
        modeInstructions = `
        MODO LIVRO: SOBREVIVÊNCIA (Pareto Extremo)
        - ESTRUTURA: Liste TODOS os capítulos.
        - DENSIDADE: 1 frase por capítulo. 1 conceito chave.
        - SUPORTE: NÃO GERE.
        `;
        break;
      case StudyMode.HARD:
        modeInstructions = `
        MODO LIVRO: HARD (Deep Dive)
        - ESTRUTURA: Liste TODOS os capítulos e seções.
        - DENSIDADE: Resumo detalhado.
        - SUPORTE: Gere lista robusta.
        `;
        break;
      case StudyMode.NORMAL:
      default:
        modeInstructions = `
        MODO LIVRO: NORMAL (Equilíbrio)
        - ESTRUTURA: Liste TODOS os capítulos.
        - DENSIDADE: Pareto (20% essencial).
        - SUPORTE: Gere para contextualizar.
        `;
        break;
    }
  } else {
    const noChaptersInstruction = "NÃO GERE 'chapters'.";
    if (mode === StudyMode.HARD) {
      modeInstructions = `MODO: TURBO 🚀 (Completo). ${noChaptersInstruction} SUPORTE: OBRIGATÓRIO.`;
    } else if (mode === StudyMode.SURVIVAL) {
      modeInstructions = `MODO: SOBREVIVÊNCIA ⚡. ${noChaptersInstruction} SUPORTE: NÃO PREENCHA.`;
    } else {
      modeInstructions = `MODO: NORMAL 📚. ${noChaptersInstruction} SUPORTE: OBRIGATÓRIO.`;
    }
  }

  const MASTER_PROMPT = `
  Você é o NeuroStudy Architect.
  CONTEXTO: O usuário enviou conteúdo (${isBook ? 'LIVRO' : 'Material'}) para processamento.
  MISSÃO:
  1. Analisar conteúdo.
  2. Estratégia: ${modeInstructions}
  3. JSON estrito.
  IDIOMA: Português do Brasil.
  `;

  // --- LÓGICA HÍBRIDA (INLINE vs FILE API) ---
  const parts: any[] = [];
  
  if (isBinary) {
     // SE O ARQUIVO FOR GRANDE (> 15MB) OU FOR VÍDEO/ÁUDIO, USA A FILE API
     const isVideoOrAudio = mimeType.startsWith('video/') || mimeType.startsWith('audio/');
     const isLargeFile = content.length > 15 * 1024 * 1024; // ~11MB em base64

     if (isVideoOrAudio || isLargeFile) {
         console.log("Arquivo grande ou mídia detectada. Usando File API...");
         try {
             // 1. Faz upload
             const fileUri = await uploadFileToGemini(content, mimeType);
             
             // 2. Passa a URI para o modelo (não o base64)
             parts.push({
                 fileData: {
                     mimeType: mimeType,
                     fileUri: fileUri
                 }
             });
             
             // Se for vídeo, damos uma dica extra para analisar o vídeo todo
             if (isVideoOrAudio) {
                 parts.push({ text: "Analise este vídeo/áudio completo. Transcreva mentalmente os pontos chaves e gere o roteiro." });
             }
         } catch (e) {
             console.error("Erro no upload File API:", e);
             throw new Error("Falha ao processar arquivo grande. Tente um arquivo menor.");
         }
     } else {
         // ARQUIVO PEQUENO (PDF leve, Imagem simples) -> Manda direto (Inline)
         parts.push({ inlineData: { mimeType: mimeType, data: content } });
     }
     parts.push({ text: "Gere o roteiro de aprendizado." });
  } else {
     parts.push({ text: content });
  }

  return fetchWithRetry(async () => {
    console.log(`[Gemini] Gerando com ${MODEL_NAME}...`);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: MASTER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: finalSchema,
        temperature: 0.3,
      },
    });

    let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
    if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const guide = JSON.parse(cleanText) as StudyGuide;
    
    if (guide.checkpoints) {
        guide.checkpoints = guide.checkpoints.map(cp => ({ ...cp, completed: false }));
    }
    return guide;
  });
};

// ... Restante das funções (safeGenerate, generateSlides...) mantidas iguais ...
const safeGenerate = async (ai: GoogleGenAI, prompt: string, schemaMode = true): Promise<string> => {
    return fetchWithRetry(async () => {
        const config: any = {};
        if (schemaMode) config.responseMimeType = "application/json";
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts: [{ text: prompt }] },
            config
        });
        let text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
        return text || "";
    });
};

export const generateSlides = async (guide: StudyGuide): Promise<Slide[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const text = await safeGenerate(ai, `Crie Slides JSON sobre: "${guide.subject}".`);
        if (!text) return [];
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim() || "[]");
    } catch { return []; }
};

export const generateQuiz = async (guide: StudyGuide, mode: StudyMode, config?: any): Promise<QuizQuestion[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const prompt = `Crie um Quiz JSON com ${config?.quantity || 6} perguntas sobre ${guide.subject}.`;
        const text = await safeGenerate(ai, prompt);
        if (!text) return [];
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim() || "[]");
    } catch { return []; }
};

export const generateFlashcards = async (guide: StudyGuide): Promise<Flashcard[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const text = await safeGenerate(ai, `Crie Flashcards JSON sobre: ${guide.subject}.`);
        if (!text) return [];
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim() || "[]");
    } catch { return []; }
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
    } catch (e) {
      return "Erro ao conectar com o professor virtual.";
    }
};

export const refineContent = async (text: string, task: string): Promise<string> => { 
    const apiKey = getApiKey();
    if (!apiKey) return "Erro.";
    const ai = new GoogleGenAI({ apiKey });
    return await safeGenerate(ai, `Melhore este texto (${task}): "${text}"`, false);
};

export const generateDiagram = async (desc: string): Promise<string> => { return ""; };
