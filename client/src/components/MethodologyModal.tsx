
import React, { useState } from 'react';
import { X, BrainCircuit, Activity, Rocket, BatteryCharging, CheckCircle, Brain, Target, PenTool, Eye, Sparkles, BookOpen, RefreshCw, GraduationCap, Layers, HelpCircle, Lightbulb, FolderIcon, Calendar, Clock, FileText, Play } from './Icons';

interface MethodologyModalProps {
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'science' | 'workflow' | 'modes'>('science');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">

        {/* Header */}
        <div className="bg-indigo-900 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="w-8 h-8 text-indigo-300" />
              O Método NeuroStudy
            </h2>
            <p className="text-indigo-200 text-sm mt-1">Advance Organizer + Active Learning + Recuperação Espaçada</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={() => setActiveTab('science')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-4 ${activeTab === 'science' ? 'border-indigo-600 text-indigo-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🧠 A Ciência
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-4 ${activeTab === 'modes' ? 'border-indigo-600 text-indigo-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            ⚡ Modos & Níveis
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-4 ${activeTab === 'workflow' ? 'border-indigo-600 text-indigo-800 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🛠️ Guia & Ferramentas
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 font-sans text-gray-700 leading-relaxed scroll-smooth">

          {/* TAB: A CIÊNCIA */}
          {activeTab === 'science' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                <p className="text-lg text-indigo-900 font-medium leading-relaxed">
                  O NeuroStudy não é apenas um "resumidor". Ele é um <strong>arquiteto cognitivo</strong>. Usamos quatro pilares da neurociência para transformar estudo passivo em retenção ativa de longo prazo.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pareto */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-red-700 text-lg mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" /> 1. Princípio de Pareto (80/20)
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Conceito:</strong> 80% do valor vem de 20% do conteúdo.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Na Plataforma:</strong> O algoritmo lê tudo (vídeo, PDF, livro) e extrai apenas os <strong>"Conceitos Core"</strong> (os 20% de ouro). Você economiza energia cognitiva ignorando a "palha".
                  </p>
                </div>

                {/* Active Learning */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-emerald-700 text-lg mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> 2. Active Learning
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Conceito:</strong> Ler é passivo. <em>Produzir</em> retém.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Na Plataforma:</strong> Você não apenas lê; você é forçado a interagir. Checkpoints exigem que você desenhe, anote à mão ou responda perguntas. Aprender vira um verbo de ação.
                  </p>
                </div>

                {/* Schema Theory */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-blue-700 text-lg mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5" /> 3. Schema Theory
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Conceito:</strong> O cérebro precisa de "ganchos" antigos para pendurar ideias novas.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Na Plataforma:</strong> O <strong>Advance Organizer</strong> cria uma "ponte mental" antes de você começar o estudo denso. Ele ativa o que você já sabe para acelerar a absorção do novo.
                  </p>
                </div>

                {/* Spaced Repetition */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-purple-700 text-lg mb-2 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" /> 4. Repetição Espaçada
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Conceito:</strong> A Curva do Esquecimento é implacável.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Na Plataforma:</strong> Agendamos revisões estratégicas (1, 7, 14, 30 dias) e usamos Flashcards. O objetivo é mover o conteúdo da memória curta para a <strong>memória de longo prazo</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MODOS & NÍVEIS */}
          {activeTab === 'modes' && (
            <div className="space-y-10 max-w-4xl mx-auto animate-fade-in">

              {/* CARRO CHEFE: NEUROSTUDY */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden transform hover:scale-[1.01] transition-transform">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
                  <BrainCircuit className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                    <Layers className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">🎓 Modo NeuroStudy (Clássico)</h3>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">Recomendado</span>
                    </div>
                    <p className="text-indigo-100 text-lg mb-4 font-light">
                      O carro-chefe da plataforma. Ideal para videoaulas, artigos e roteiros de estudo diários.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-4">
                      <li className="flex items-center gap-2 bg-black/20 p-3 rounded-lg text-sm border border-white/10">
                        <CheckCircle className="w-5 h-5 text-green-300" /> Guia Roteirizado Passo-a-Passo
                      </li>
                      <li className="flex items-center gap-2 bg-black/20 p-3 rounded-lg text-sm border border-white/10">
                        <Target className="w-5 h-5 text-red-300" /> Foco em Tópicos Chave + Ação
                      </li>
                      <li className="flex items-center gap-2 bg-black/20 p-3 rounded-lg text-sm border border-white/10">
                        <Activity className="w-5 h-5 text-blue-300" /> Checkpoints Interativos
                      </li>
                      <li className="flex items-center gap-2 bg-black/20 p-3 rounded-lg text-sm border border-white/10">
                        <Brain className="w-5 h-5 text-purple-300" /> Professor Particular via IA
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* OUTROS MODOS */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Modo Livro */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 relative overflow-hidden group hover:border-orange-300 transition-colors">
                  <div className="flex items-start gap-4 z-10 relative">
                    <div className="bg-white text-orange-600 p-3 rounded-xl shadow-sm shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-orange-900 mb-2">📚 Modo Livro</h4>
                      <p className="text-sm text-orange-800 mb-3">
                        Para obras completas, e-books e PDFs densos. Processamento hierárquico.
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs bg-white/60 p-2 rounded text-orange-900"><strong>1. Big Picture:</strong> Entenda o todo antes das partes.</div>
                        <div className="text-xs bg-white/60 p-2 rounded text-orange-900"><strong>2. Capítulos 80/20:</strong> A essência de cada seção.</div>
                        <div className="text-xs bg-white/60 p-2 rounded text-orange-900"><strong>3. Gamificação:</strong> Barra de progresso por capítulo.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modo Pareto Strict */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative overflow-hidden group hover:border-gray-400 transition-colors">
                  <div className="flex items-start gap-4 z-10 relative">
                    <div className="bg-white text-gray-700 p-3 rounded-xl shadow-sm shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-gray-900 mb-2">🔥 Modo Pareto (Strict)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Para consultas rápidas, dúvidas pontuais ou resumos executivos.
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs bg-white p-2 rounded text-gray-700 border border-gray-100"><strong>Estilo Jornalístico:</strong> Direto ao ponto.</div>
                        <div className="text-xs bg-white p-2 rounded text-gray-700 border border-gray-100"><strong>Sem "Lero-Lero":</strong> Apenas a resposta crua.</div>
                        <div className="text-xs bg-white p-2 rounded text-gray-700 border border-gray-100"><strong>Velocidade:</strong> Para quem tem pressa.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NÍVEIS DE PROFUNDIDADE */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> Níveis de Profundidade (Intensidade da IA)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                    <strong className="text-green-800 block mb-1">🟢 Sobrevivência</strong>
                    <p className="text-xs text-green-700">"A prova é amanhã!". Foca no mínimo viável para salvar o dia. Resumos curtos.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <strong className="text-blue-800 block mb-1">🔵 Normal</strong>
                    <p className="text-xs text-blue-700">Dia a dia. O equilíbrio perfeito entre teoria e prática para retenção saudável.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                    <strong className="text-purple-800 block mb-1">🟣 Hard</strong>
                    <p className="text-xs text-purple-700">Especialização. A IA busca nuances, exceções e cria desafios críticos.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: WORKFLOW (GUIA DA PLATAFORMA) */}
          {activeTab === 'workflow' && (
            <div className="space-y-10 max-w-4xl mx-auto animate-fade-in">

              {/* INTRODUÇÃO VISUAL */}
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-2xl flex items-center gap-6 border border-indigo-50">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Passo 1</span>
                    <div className="bg-white p-3 rounded-xl shadow-sm"><FileText className="w-8 h-8 text-indigo-500" /></div>
                    <strong className="text-sm text-indigo-900 mt-2 block">Antes</strong>
                  </div>
                  <div className="h-0.5 w-12 bg-indigo-200"></div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Passo 2</span>
                    <div className="bg-white p-3 rounded-xl shadow-sm"><Play className="w-8 h-8 text-pink-500" /></div>
                    <strong className="text-sm text-indigo-900 mt-2 block">Durante</strong>
                  </div>
                  <div className="h-0.5 w-12 bg-indigo-200"></div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Passo 3</span>
                    <div className="bg-white p-3 rounded-xl shadow-sm"><CheckCircle className="w-8 h-8 text-green-500" /></div>
                    <strong className="text-sm text-indigo-900 mt-2 block">Depois</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. ANTES DA AULA */}
                <div className="flex gap-6 items-start">
                  <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl shrink-0"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Antes da Aula: O Preparo</h3>
                    <p className="text-gray-600 mb-2">A plataforma gera o <strong>Roteiro NeuroStudy</strong> com checkpoints.</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      <li>Leia o "Resumo Ultra-Conciso" para alinhar seu cérebro.</li>
                      <li>Dê uma olhada nos Conceitos Chave para saber o que esperar.</li>
                    </ul>
                  </div>
                </div>

                {/* 2. DURANTE A AULA (SEU CORE) */}
                <div className="flex gap-6 items-start">
                  <div className="bg-pink-50 text-pink-600 p-4 rounded-xl shrink-0"><Play className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Durante a Aula: Ação Constante</h3>
                    <p className="text-gray-600 mb-4 text-sm">Assista com o roteiro aberto. Use a técnica de 4 passos para cada Checkpoint:</p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <strong className="text-indigo-600 flex items-center gap-2 mb-2"><Eye className="w-4 h-4" /> 1. ASSISTA (5-7 min)</strong>
                        <p className="text-xs text-gray-500">Rode o vídeo. Quando o assunto do checkpoint começar, <strong>foco total</strong>.</p>
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <strong className="text-red-500 flex items-center gap-2 mb-2"><Activity className="w-4 h-4" /> 2. PAUSE (2-3 min)</strong>
                        <p className="text-xs text-gray-500">Terminou o ponto? Pause. Responda a pergunta chave e faça a anotação sugerida.</p>
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <strong className="text-green-600 flex items-center gap-2 mb-2"><BatteryCharging className="w-4 h-4" /> 3. MICRO-PAUSA (30s)</strong>
                        <p className="text-xs text-gray-500">Respire fundo 3x. Olhe longe. Tome água. Reinicie o ciclo.</p>
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <strong className="text-purple-600 flex items-center gap-2 mb-2"><Rocket className="w-4 h-4" /> 4. CHECK & CONTINUE</strong>
                        <p className="text-xs text-gray-500">Marque o checkpoint como feito (Dopamina!). Próximo nível.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. DEPOIS DA AULA */}
                <div className="flex gap-6 items-start">
                  <div className="bg-green-50 text-green-600 p-4 rounded-xl shrink-0"><Layers className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Depois da Aula: Consolidação</h3>
                    <p className="text-gray-600 mb-2">Agora que você entendeu, precisa <strong>gravar</strong>.</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      <li>Use os <strong>Flashcards</strong> (Recuperação Ativa).</li>
                      <li>Faça o <strong>Quiz</strong> para testar lacunas.</li>
                      <li>Agende sua Revisão Automática.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mt-4">
                  <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-1"><Target className="w-5 h-5" /> Por que isso funciona?</h4>
                  <p className="text-sm text-yellow-800">
                    ✅ <strong>Micro-objetivos:</strong> Cada checkpoint é uma vitória rápida.<br />
                    ✅ <strong>Ação Constante:</strong> Impossível ficar passivo ou entediado.<br />
                    ✅ <strong>Controle:</strong> Você dita o ritmo, não o vídeo.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            Entendi, vamos estudar!
          </button>
        </div>
      </div>
    </div>
  );
};
