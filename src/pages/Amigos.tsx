import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Prova, Aposta, ReacaoVoto, TipoReacao } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Top3UsersList from '../components/Top3UsersListClean';

interface ApostaComDetalhes extends Aposta {
  username: string;
  avatar_url: string | null;
  participante_nome: string;
  participante_foto_url?: string | null;
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
  const [votosTop3ByUser, setVotosTop3ByUser] = useState<Record<string, { primeiro?: { nome?: string; foto_url?: string | null }; segundo?: { nome?: string; foto_url?: string | null }; terceiro?: { nome?: string; foto_url?: string | null }; updated_at?: string }>>({});
  const { user } = useAuth();

  useEffect(() => {
    loadApostasAtivas();
  }, []);

  useEffect(() => {
    if (apostasAtivas.length > 0) {
      loadReacoes();
    }
    if (apostasAtivas.length > 0) {
      loadTop3Usuarios();
    }
  }, [apostasAtivas]);

  const loadTop3Usuarios = async () => {
    try {
      const userIds = [...new Set(apostasAtivas.map(a => a.user_id))];
      if (userIds.length === 0) {
        setVotosTop3ByUser({});
        return;
      }

      const { data: votos, error: votosError } = await supabase
        .from('votos_top3')
        .select('*')
        .in('user_id', userIds);

      if (votosError) throw votosError;

      if (!votos || votos.length === 0) {
        setVotosTop3ByUser({});
        return;
      }

      const participanteIds = [
        ...new Set(votos.flatMap(v => [v.primeiro_lugar_id, v.segundo_lugar_id, v.terceiro_lugar_id]).filter(Boolean))
      ] as string[];

      const { data: participantes } = await supabase
        .from('participantes')
        .select('id, nome, foto_url')
        .in('id', participanteIds);

      const participantesMap: Record<string, { nome?: string; foto_url?: string | null }> = {};
      participantes?.forEach(p => { if (p.id) participantesMap[p.id] = { nome: p.nome, foto_url: p.foto_url }; });

      const map: Record<string, { primeiro?: { nome?: string; foto_url?: string | null }; segundo?: { nome?: string; foto_url?: string | null }; terceiro?: { nome?: string; foto_url?: string | null }; updated_at?: string }> = {};
      votos.forEach((v: any) => {
        map[v.user_id] = {
          primeiro: participantesMap[v.primeiro_lugar_id] || undefined,
          segundo: participantesMap[v.segundo_lugar_id] || undefined,
          terceiro: participantesMap[v.terceiro_lugar_id] || undefined,
          updated_at: v.updated_at
        };
      });

      setVotosTop3ByUser(map);
    } catch (error) {
      console.error('Erro ao carregar top3 dos usuários:', error);
    }
  };

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

      const participanteIds = [...new Set(apostas.map(a => a.participante_id).filter(id => id !== null))];
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
          participante_nome: aposta.resposta_binaria ? aposta.resposta_binaria.toUpperCase() : (participante?.nome || 'N/A'),
          participante_foto_url: participante?.foto_url || null,
          prova_descricao: prova?.descricao || prova?.pergunta || '',
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

  // montar array para o componente Top3 standalone
  const votosTop3Array = Object.entries(votosTop3ByUser).map(([user_id, v]) => ({
    id: user_id,
    user_id,
    username: apostasAtivas.find(a => a.user_id === user_id)?.username || user_id,
    primeiro: v.primeiro ? { id: '', nome: v.primeiro.nome } : undefined,
    segundo: v.segundo ? { id: '', nome: v.segundo.nome } : undefined,
    terceiro: v.terceiro ? { id: '', nome: v.terceiro.nome } : undefined,
    updated_at: v.updated_at
  }));

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
                      {prova.tipo_customizado ? prova.titulo_customizado : getTipoProvaLabel(prova.tipo)}
                    </h2>
                    {prova.tipo_customizado && (
                      <p className="text-pink-300 text-xs">Prova Customizada</p>
                    )}
                    {prova.descricao && (
                      <p className="text-white/60 text-sm">{prova.descricao}</p>
                    )}
                  </div>
                  <span className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded-md">
                    {new Date(prova.data_prova).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Agrupar por usuário (quem votou -> em quem votou) */}
                {(() => {
                  const votosPorUsuario: Record<string, typeof apostasProva> = {};
                  const usuarioInfo: Record<string, { username: string; avatar_url: string | null }> = {};

                  apostasProva.forEach(aposta => {
                    if (!votosPorUsuario[aposta.user_id]) votosPorUsuario[aposta.user_id] = [];
                    votosPorUsuario[aposta.user_id].push(aposta);
                    if (!usuarioInfo[aposta.user_id]) {
                      usuarioInfo[aposta.user_id] = { username: aposta.username, avatar_url: aposta.avatar_url };
                    }
                  });

                  const usuariosOrdenados = Object.entries(votosPorUsuario).sort((a, b) => b[1].length - a[1].length);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usuariosOrdenados.map(([userId, votos]) => {
                        const info = usuarioInfo[userId];
                        const isCurrentUser = user?.id === userId;

                        return (
                          <div key={userId} className={`rounded-xl border overflow-hidden ${isCurrentUser ? 'bg-purple-500/10 border-purple-400/30' : 'bg-white/5 border-white/10'}`}>
                            <div className={`px-4 py-3 border-b flex items-center justify-between ${isCurrentUser ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                              <div className="flex items-center gap-3">
                                {info.avatar_url ? (
                                  <img src={info.avatar_url} alt={info.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                    {info.username?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-purple-200' : 'text-white'}`}>@{info.username}</p>
                                  <p className="text-white/60 text-xs">{votos.length} voto{votos.length > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="text-xs text-white/40 px-2 py-0.5 rounded-md">{getTipoProvaLabel(prova.tipo)}</div>
                            </div>

                            <div className="p-3 space-y-2">
                              {votos.map(aposta => {
                                const reacoesAposta = getReacoesAposta(aposta.id);

                                return (
                                  <div key={aposta.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/3 border border-white/5">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex items-center gap-3 min-w-0">
                                        {aposta.participante_foto_url ? (
                                          <img src={aposta.participante_foto_url} alt={aposta.participante_nome} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold">
                                            {aposta.participante_nome?.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-semibold truncate text-white">{aposta.participante_nome}</span>
                                          <span className="text-xs text-white/60 truncate">{aposta.prova_descricao}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Reações (pequenas) */}
                                      <div className="flex gap-1">
                                        {(['like', 'fire', 'thinking', 'skull', 'clown'] as TipoReacao[])
                                          .filter(t => reacoesAposta.some(r => r.tipo === t))
                                          .map(tipo => {
                                            const r = reacoesAposta.find(x => x.tipo === tipo);
                                            const count = r?.count || 0;
                                            const userReacted = r?.userReacted || false;

                                            return (
                                              <button
                                                key={tipo}
                                                onClick={() => toggleReacao(aposta.id, tipo)}
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                                                  userReacted
                                                    ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                }`}
                                              >
                                                <span>{getEmojiReacao(tipo)}</span>
                                                <span className="text-white/60">{count}</span>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Top3 standalone ao final da página de Amigos */}
      <div className="mt-6">
        <Top3UsersList votosTop3={votosTop3Array} currentUserId={user?.id} />
      </div>
    </div>
  );
}
