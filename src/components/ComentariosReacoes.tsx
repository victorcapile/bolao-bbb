import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ComentarioAposta, TipoReacao } from '../lib/supabase';

interface ComentariosReacoesProps {
  apostaId: string;
  reacoes: Array<{ tipo: TipoReacao; count: number; usuarios: string[] }>;
  onReacaoChange: () => void;
}

const EMOJI_REACOES: Record<TipoReacao, string> = {
  like: '👍',
  fire: '🔥',
  thinking: '🤔',
  skull: '💀',
  clown: '🤡'
};

export default function ComentariosReacoes({ apostaId, reacoes, onReacaoChange }: ComentariosReacoesProps) {
  const [comentarios, setComentarios] = useState<ComentarioAposta[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [mostrarInput, setMostrarInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    carregarComentarios();
  }, [apostaId]);

  async function carregarComentarios() {
    const { data, error } = await supabase
      .from('comentarios_apostas')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('aposta_id', apostaId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const comentariosFormatados = data.map(c => ({
        ...c,
        username: c.profiles?.username,
        avatar_url: c.profiles?.avatar_url
      }));
      setComentarios(comentariosFormatados);
    }
  }

  async function enviarComentario() {
    if (!novoComentario.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comentarios_apostas')
        .insert({
          aposta_id: apostaId,
          user_id: user.id,
          comentario: novoComentario.trim()
        });

      if (error) throw error;

      setNovoComentario('');
      setMostrarInput(false);
      carregarComentarios();
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      alert('Erro ao enviar comentário');
    } finally {
      setLoading(false);
    }
  }

  async function toggleReacao(tipo: TipoReacao) {
    if (!user) return;

    try {
      // Verificar se já reagiu com esse tipo
      const { data: existing } = await supabase
        .from('reacoes_votos')
        .select('id')
        .eq('aposta_id', apostaId)
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .single();

      if (existing) {
        // Remover reação
        await supabase
          .from('reacoes_votos')
          .delete()
          .eq('id', existing.id);
      } else {
        // Adicionar reação (primeiro remove outras reações do usuário)
        await supabase
          .from('reacoes_votos')
          .delete()
          .eq('aposta_id', apostaId)
          .eq('user_id', user.id);

        await supabase
          .from('reacoes_votos')
          .insert({
            aposta_id: apostaId,
            user_id: user.id,
            tipo
          });
      }

      onReacaoChange();
    } catch (error) {
      console.error('Erro ao reagir:', error);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Reações */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EMOJI_REACOES).map(([tipo, emoji]) => {
          const reacao = reacoes.find(r => r.tipo === tipo);
          const count = reacao?.count || 0;
          const reagiu = user && reacao?.usuarios.includes(user.id);

          return (
            <button
              key={tipo}
              onClick={() => toggleReacao(tipo as TipoReacao)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                reagiu
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 scale-110'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
              title={reacao?.usuarios.map(id => id).join(', ')}
            >
              <span className="mr-1">{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Botão para mostrar input de comentário */}
      {!mostrarInput && (
        <button
          onClick={() => setMostrarInput(true)}
          className="text-white/60 hover:text-white text-sm transition-all flex items-center gap-2"
        >
          💬 Deixe um comentário ou uma reação
        </button>
      )}

      {/* Input de comentário */}
      {mostrarInput && (
        <div className="space-y-2 animate-in slide-in-from-top duration-200">
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Escreva um comentário..."
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={enviarComentario}
              disabled={loading || !novoComentario.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              onClick={() => {
                setMostrarInput(false);
                setNovoComentario('');
              }}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de comentários */}
      {comentarios.length > 0 && (
        <div className="space-y-2 mt-3">
          {comentarios.map((comentario) => (
            <div
              key={comentario.id}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-start gap-2">
                {comentario.avatar_url ? (
                  <img
                    src={comentario.avatar_url}
                    alt={comentario.username || ''}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs">
                    {comentario.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/90 font-medium text-sm">
                      {comentario.username || 'Usuário'}
                    </span>
                    <span className="text-white/40 text-xs">
                      {new Date(comentario.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">{comentario.comentario}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
