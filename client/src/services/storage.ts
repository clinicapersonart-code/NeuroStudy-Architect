import { createClient } from '@supabase/supabase-js';
import { StudySession } from '../types';

const APP_MODE = import.meta.env.VITE_APP_MODE || 'DEMO';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = (APP_MODE === 'PRO' && SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const LOCAL_KEY = 'neurostudy_data';

export const storage = {
  async getAll(): Promise<StudySession[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('studies').select('data').order('updated_at', { ascending: false });
        if (error) throw error;
        return data?.map((row: any) => row.data) || [];
      } catch (e) { return []; }
    } else {
      const local = localStorage.getItem(LOCAL_KEY);
      return local ? JSON.parse(local) : [];
    }
  },
  async save(study: StudySession) {
    if (supabase) {
      await supabase.from('studies').upsert({ id: study.id, updated_at: new Date().toISOString(), data: study });
    } else {
      const list = await this.getAll();
      const index = list.findIndex(s => s.id === study.id);
      if (index >= 0) list[index] = study; else list.unshift(study);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    }
  },
  async delete(id: string) {
    if (supabase) {
      await supabase.from('studies').delete().eq('id', id);
    } else {
      const list = await this.getAll();
      const filtered = list.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    }
  }
};
