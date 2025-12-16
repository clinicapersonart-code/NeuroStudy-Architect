import { StudySession, Folder } from '../types';
import { supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'neurostudy_data';

/**
 * Verifica se o modo nuvem (Supabase) está ativo.
 */
export const isCloudMode = () => !!supabase;

/**
 * Salva os dados do usuário, escolhendo entre Supabase (Modo Nuvem) ou LocalStorage (Modo Local/Amigos).
 */
export const saveUserData = async (studies: StudySession[], folders: Folder[]) => {
  if (isCloudMode()) {
    // MODO NUVEM (Para ti): Salva tudo no Supabase no ID fixo 1.
    const { error } = await supabase!
      .from('user_data')
      .upsert({ 
        id: 1, 
        content: { studies, folders }, 
        updated_at: new Date().toISOString() 
      });
      
    if (error) console.error('Erro ao salvar na nuvem:', error);
  } else {
    // MODO LOCAL (Para amigos): Salva no navegador.
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ studies, folders }));
  }
};

/**
 * Carrega os dados, tentando primeiro o Supabase e, se não for configurado, usa o LocalStorage.
 */
export const loadUserData = async (): Promise<{ studies: StudySession[], folders: Folder[] }> => {
  const defaultData = { studies: [], folders: [] };

  if (isCloudMode()) {
    // MODO NUVEM
    const { data, error } = await supabase!
      .from('user_data')
      .select('content')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: Nenhuma linha encontrada (OK se for o primeiro acesso)
      console.error('Erro ao carregar da nuvem:', error);
      return defaultData;
    }
    return data?.content || defaultData;
  } else {
    // MODO LOCAL
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  }
};
