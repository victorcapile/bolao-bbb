import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Prova, Aposta, ReacaoVoto, TipoReacao } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ApostaComDetalhes extends Aposta {
  username: string;
  avatar_url: string | null;
  participante_nome: string;
  prova_descricao: string;
  prova_tipo: string;
}

interface ReacaoComContagem {
  tipo: TipoReacao;
  count: number;
  userReacted: boolean;
}

export default function Amigos() {
  const [apostasAtivas, setApostasAtivas] = useState<ApostaComDetalhes[]>([]);
  const [provasAtivas, setProvasAtivas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacoes, setReacoes] = useState<ReacaoVoto[]>([]);
  const [openReactionsId, setOpenReactionsId] = useState<string | null>(null);
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadApostasAtivas();

    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenReactionsId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (apostasAtivas.length > 0) {
      loadReacoes();
    }
  }, [apostasAtivas]);

  const loadApostasAtivas = async () => {
    try {
      const { data: provas, error: provasError } = await supabase
        .from('provas')
        .select('*')
        .eq('fechada', false)
        .eq('arquivada', false)
        .order('data_prova', { ascending: true });

      if (provasError) throw provasError;

      setProvasAtivas(provas || []);

      if (!provas || provas.length === 0) {
        setApostasAtivas([]);
        setLoading(false);
        return;
      }

      const provaIds = provas.map(p => p.id);
      const { data: apostas, error: apostasError } = await supabase
        .from('apostas')
        .select('*')
        .in('prova_id', provaIds);

      if (apostasError) throw apostasError;

      if (!apostas || apostas.length === 0) {
        setApostasAtivas([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(apostas.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const participanteIds = [...new Set(apostas.map(a => a.participante_id))];
      const { data: participantes } = await supabase
        .from('participantes')
        .select('*')
        .in('id', participanteIds);

      const apostasComDetalhes: ApostaComDetalhes[] = apostas.map(aposta => {
        const profile = profiles?.find(p => p.id === aposta.user_id);
        const participante = participantes?.find(p => p.id === aposta.participante_id);
        const prova = provas.find(p => p.id === aposta.prova_id);

        return {
          ...aposta,
          username: profile?.username || 'Usuário',
          avatar_url: profile?.avatar_url || null,
          participante_nome: participante?.nome || 'N/A',
          prova_descricao: prova?.descricao || '',
          prova_tipo: prova?.tipo || '',
        };
      });

      setApostasAtivas(apostasComDetalhes);
    } catch (error) {
      console.error('Erro ao carregar apostas ativas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReacoes = async () => {
    try {
      const apostaIds = apostasAtivas.map(a => a.id);
      const { data, error } = await supabase
        .from('reacoes_votos')
        .select('*')
        .in('aposta_id', apostaIds);

      if (error) throw error;
      setReacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar reações:', error);
    }
  };

  const toggleReacao = async (apostaId: string, tipo: TipoReacao) => {
    if (!user) return;

    try {
      const reacaoExistente = reacoes.find(
        r => r.aposta_id === apostaId && r.user_id === user.id && r.tipo === tipo
      );

      if (reacaoExistente) {
        const { error } = await supabase
          .from('reacoes_votos')
          .delete()
          .eq('id', reacaoExistente.id);

        if (error) throw error;
        setReacoes(reacoes.filter(r => r.id !== reacaoExistente.id));
      } else {
        const { data, error } = await supabase
          .from('reacoes_votos')
          .insert({
            aposta_id: apostaId,
            user_id: user.id,
            tipo
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setReacoes([...reacoes, data]);
        }
      }
      setOpenReactionsId(null); // Fechar menu após reagir
    } catch (error) {
      console.error('Erro ao reagir:', error);
    }
  };

  const getReacoesAposta = (apostaId: string): ReacaoComContagem[] => {
    const tiposReacao: TipoReacao[] = ['like', 'fire', 'thinking', 'skull', 'clown'];
    const reacoesAposta = reacoes.filter(r => r.aposta_id === apostaId);

    return tiposReacao.map(tipo => ({
      tipo,
      count: reacoesAposta.filter(r => r.tipo === tipo).length,
      userReacted: reacoesAposta.some(r => r.tipo === tipo && r.user_id === user?.id)
    })).filter(r => r.count > 0 || r.userReacted);
  };

  const getEmojiReacao = (tipo: TipoReacao): string => {
    const emojis: Record<TipoReacao, string> = {
      like: '👍',
      fire: '🔥',
      thinking: '🤔',
      skull: '💀',
      clown: '🤡'
    };
    return emojis[tipo];
  };

  const getTipoProvaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      lider: '👑 Líder',
      anjo: '😇 Anjo',
      paredao: '🔥 Paredão',
      bate_volta: '🔄 Bate/Volta',
      palpite_paredao: '🎯 Palpite'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <div className="glass rounded-xl px-6 py-2">
          <span className="text-white text-sm font-medium">Carregando votos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
          Votos dos Amigos
        </h1>
        <p className="text-white/60 text-sm">Acompanhe quem votou em quem</p>
      </div>

      {provasAtivas.length === 0 || apostasAtivas.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-white/70 text-sm">Nenhum voto ativo para mostrar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {provasAtivas.map((prova) => {
            const apostasProva = apostasAtivas.filter(a => a.prova_id === prova.id);
            if (apostasProva.length === 0) return null;

            return (
              <div key={prova.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {getTipoProvaLabel(prova.tipo)}
                    </h2>
                    {prova.descricao && (
                      <p className="text-white/60 text-sm">{prova.descricao}</p>
                    )}
                  </div>
                  <span className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded-md">
                    {new Date(prova.data_prova).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Agrupar por participante */}
                {(() => {
                  const votosPorParticipante: Record<string, typeof apostasProva> = {};
                  apostasProva.forEach(aposta => {
                    if (!votosPorParticipante[aposta.participante_nome]) {
                      votosPorParticipante[aposta.participante_nome] = [];
                    }
                    votosPorParticipante[aposta.participante_nome].push(aposta);
                  });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(votosPorParticipante)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([participanteNome, votos]) => (
                          <div key={participanteNome} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                              <h3 className="text-white font-bold text-sm">
                                {participanteNome}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                                {votos.length}
                              </span>
                            </div>
                            <div className="p-3 space-y-2">
                              {votos.map((aposta) => {
                                const isMyVote = aposta.user_id === user?.id;
                                const reacoesAposta = getReacoesAposta(aposta.id);
                                const isOpen = openReactionsId === aposta.id;

                                return (
                                  <div
                                    key={aposta.id}
                                    className={`relative rounded-lg p-2 transition-all ${isMyVote
                                        ? 'bg-purple-500/20 border border-purple-400/30'
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {aposta.avatar_url ? (
                                          <img
                                            src={aposta.avatar_url}
                                            alt={aposta.username}
                                            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                            {aposta.username.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className={`font-bold text-sm truncate ${isMyVote ? 'text-purple-200' : 'text-white'}`}>
                                            @{aposta.username}
                                          </p>
                                          {/* Reações existentes */}
                                          {reacoesAposta.length > 0 && (
                                            <div className="flex gap-1 mt-0.5">
                                              {reacoesAposta.map(r => (
                                                <span key={r.tipo} className="text-[10px] bg-black/20 px-1 rounded flex items-center gap-0.5" title={`${r.count} reações`}>
                                                  {getEmojiReacao(r.tipo)}
                                                  <span className="text-white/70">{r.count}</span>
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Botão de Reagir (+Menu) */}
                                      {!isMyVote && (
                                        <div className="relative">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenReactionsId(isOpen ? null : aposta.id);
                                            }}
                                            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              {isOpen ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              )}
                                            </svg>
                                          </button>

                                          {/* Menu de Reações (Popover) */}
                                          {isOpen && (
                                            <div
                                              ref={menuRef}
                                              className="absolute right-0 bottom-8 z-20 bg-[#1e1e2e] border border-white/10 rounded-lg shadow-xl p-1.5 flex gap-1 animate-in fade-in zoom-in duration-200"
                                            >
                                              {['like', 'fire', 'thinking', 'skull', 'clown'].map(tipo => (
                                                <button
                                                  key={tipo}
                                                  onClick={() => toggleReacao(aposta.id, tipo as TipoReacao)}
                                                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md text-lg transition-transform hover:scale-110 active:scale-95"
                                                >
                                                  {getEmojiReacao(tipo as TipoReacao)}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
