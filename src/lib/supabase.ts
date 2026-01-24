import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados
export type TipoProva = 'lider' | 'anjo' | 'bate_volta' | 'paredao' | 'palpite_paredao';

export interface Participante {
  id: string;
  nome: string;
  foto_url: string | null;
  ativo: boolean;
  is_lider_atual?: boolean;
  is_anjo_atual?: boolean;
  is_imune_atual?: boolean;
  created_at: string;
}

export interface Prova {
  id: string;
  tipo: TipoProva;
  data_prova: string;
  descricao: string | null;
  fechada: boolean;
  vencedor_id: string | null;
  arquivada: boolean;
  created_at: string;
  titulo_customizado: string | null;
  max_escolhas: number;
  tipo_customizado: boolean;
  votacao_aberta: boolean;
}

export interface Aposta {
  id: string;
  user_id: string;
  prova_id: string;
  participante_id: string;
  pontos: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  nome_completo: string | null;
  avatar_url: string | null;
  pontos_totais: number;
  is_admin: boolean;
  xp: number;
  nivel: number;
  created_at: string;
}

export interface RankingEntry {
  id: string;
  username: string;
  nome_completo: string | null;
  avatar_url: string | null;
  pontos_totais: number;
  acertos: number;
  total_apostas: number;
  xp: number;
  nivel: number;
}

export interface Emparedado {
  id: string;
  prova_id: string;
  participante_id: string;
  created_at: string;
}

export interface FeedAtividade {
  id: string;
  user_id: string;
  tipo: 'acerto' | 'erro' | 'streak' | 'nivel_up' | 'lideranca' | 'badge';
  descricao: string;
  metadata: any;
  created_at: string;
  username?: string;
  avatar_url?: string;
  nivel?: number;
}

export type TipoReacao = 'like' | 'fire' | 'thinking' | 'skull' | 'clown';

export interface ReacaoVoto {
  id: string;
  aposta_id: string;
  user_id: string;
  tipo: TipoReacao;
  created_at: string;
}

export interface ComentarioAposta {
  id: string;
  aposta_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: 'comentario' | 'reacao';
  referencia_id: string;
  lida: boolean;
  mensagem: string;
  created_at: string;
}
