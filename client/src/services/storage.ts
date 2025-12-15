import { createClient } from '@supabase/supabase-js';
import { StudySession, Folder } from '../types';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Só cria a conexão se as chaves existirem
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const LOCAL_STUDIES_KEY = 'neuro_studies_data';
const LOCAL_FOLDERS_KEY = 'neuro_folders_data';

// Verifica se é VOCÊ (Dono) logado
const isProUser = () => localStorage.getItem('neurostudy_auth') === 'true';

export const storage = {
  // --- CARREGAR DADOS ---
  loadData: async () => {
    let studies: StudySession[] = [];
    let folders: Folder[] = [];

    // 1. Carrega do LocalStorage (funciona para todos e offline)
    try {
      const localS = localStorage.getItem(LOCAL_STUDIES_KEY);
      const localF = localStorage.getItem(LOCAL_FOLDERS_KEY);
      if (localS) studies = JSON.parse(localS);
      if (localF) folders = JSON.parse(localF);
    } catch (e) {
      console.error('Erro local:', e);
    }

    // 2. Se for VOCÊ (Pro), tenta baixar a versão mais recente da nuvem e sobrescreve
    if (isProUser() && supabase) {
      try {
        const { data } = await supabase.from('neuro_backup').select('*');
        
        if (data && data.length > 0) {
          const cloudStudies = data.find(row => row.id === 'studies')?.content;
          const cloudFolders = data.find(row => row.id === 'folders')?.content;
          
          if (cloudStudies) studies = cloudStudies;
          if (cloudFolders) folders = cloudFolders;
          console.log('☁️ Sincronizado com a Nuvem (Pro)');
        }
      } catch (e) {
        console.error('⚠️ Erro ao conectar Supabase:', e);
      }
    }

    return { studies, folders };
  },

  // --- SALVAR DADOS ---
  saveData: async (studies: StudySession[], folders: Folder[]) => {
    // 1. Sempre salva no navegador (Backup)
    localStorage.setItem(LOCAL_STUDIES_KEY, JSON.stringify(studies));
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));

    // 2. Se for VOCÊ (Pro), salva também na nuvem
    if (isProUser() && supabase) {
      try {
        await supabase.from('neuro_backup').upsert({ id: 'studies', content: studies });
        await supabase.from('neuro_backup').upsert({ id: 'folders', content: folders });
      } catch (e) {
        console.error('Erro nuvem:', e);
      }
    }
  }
};
