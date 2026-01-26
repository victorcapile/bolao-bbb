import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RankingEntry, Participante } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StreakBadge from '../components/StreakBadge';
import NivelBadge from '../components/NivelBadge';

interface VotoTop3 {
  id: string;
  user_id: string;
  primeiro_lugar_id: string | null;
  segundo_lugar_id: string | null;
  terceiro_lugar_id: string | null;
  created_at: string;
  updated_at: string;
}

interface VotoComUsuario extends VotoTop3 {
  username: string;
  primeiro?: Participante;
  segundo?: Participante;
  terceiro?: Participante;
}

interface Streak {
  user_id: string;
  streak_atual: number;
  maior_streak: number;
}

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [votosTop3, setVotosTop3] = useState<VotoComUsuario[]>([]);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRanking();
    loadVotosTop3();
    loadStreaks();
  }, []);

  const loadRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('pontos_totais', { ascending: false })
        .order('xp', { ascending: false })
        .order('nivel', { ascending: false });

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotosTop3 = async () => {
    try {
      const { data: votosData, error } = await supabase
        .from('votos_top3')
        .select('*');

      if (error) throw error;

      if (!votosData || votosData.length === 0) {
        setVotosTop3([]);
        return;
      }

      // Carregar dados dos usuários e participantes
      const userIds = votosData.map((v) => v.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const participanteIds = [
        ...new Set(
          votosData.flatMap((v) => [
            v.primeiro_lugar_id,
            v.segundo_lugar_id,
            v.terceiro_lugar_id,
          ])
        ),
      ].filter(Boolean) as string[];

      const { data: participantesData } = await supabase
        .from('participantes')
        .select('*')
        .in('id', participanteIds);

      // Combinar dados
      const votosComDetalhes = votosData.map((voto) => {
        const profile = profilesData?.find((p) => p.id === voto.user_id);
        return {
          ...voto,
          username: profile?.username || 'Usuário',
          primeiro: participantesData?.find((p) => p.id === voto.primeiro_lugar_id),
          segundo: participantesData?.find((p) => p.id === voto.segundo_lugar_id),
          terceiro: participantesData?.find((p) => p.id === voto.terceiro_lugar_id),
        };
      });

      setVotosTop3(votosComDetalhes);
    } catch (error) {
      console.error('Erro ao carregar votos top 3:', error);
    }
  };

  const loadStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*');

      if (error) throw error;

      const streaksMap: Record<string, Streak> = {};
      data?.forEach((streak) => {
        streaksMap[streak.user_id] = streak;
      });

      setStreaks(streaksMap);
    } catch (error) {
      console.error('Erro ao carregar streaks:', error);
    }
  };

  const getPosicao = (index: number) => {
    // Calcular posição considerando APENAS empates de pontos (não XP)
    // XP é usado apenas para ordenar quem aparece primeiro em caso de empate
    if (index === 0) return 1;

    const pontuacaoAtual = ranking[index].pontos_totais;
    const pontuacaoAnterior = ranking[index - 1].pontos_totais;

    // Se empatou em pontos, mantém a mesma posição (mesmo que XP seja diferente)
    if (pontuacaoAtual === pontuacaoAnterior) {
      return getPosicao(index - 1);
    }

    // Se não empatou em pontos, a posição é o índice + 1
    return index + 1;
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-yellow-500/20 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-t-yellow-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-pulse">🏆</span>
          </div>
        </div>
        <div className="glass rounded-2xl px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-white text-sm font-medium ml-2">Carregando ranking</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Ranking
        </h1>
        <p className="text-white/70">Veja quem está no topo do Bolão BBB!</p>
      </div>

      {ranking.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-white/70 text-lg">Nenhum jogador com pontos ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((entry, index) => (
            <div
              key={entry.id}
              className={`glass rounded-2xl p-4 transition-all ${
                user?.id === entry.id ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
              } ${index < 3 ? 'shadow-xl' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold w-16 text-center text-white">
                  {getPosicao(index)}º
                </div>

                <div className="flex items-center gap-3 flex-1">
                  {entry.avatar_url && (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">
                      {entry.nome_completo || entry.username}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">@{entry.username}</span>
                      <NivelBadge
                        nivel={entry.nivel || 1}
                        xp={entry.xp || 0}
                        size="sm"
                        showXP={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
                  {streaks[entry.id] && (
                    <StreakBadge
                      streakAtual={streaks[entry.id].streak_atual}
                      maiorStreak={streaks[entry.id].maior_streak}
                      size="sm"
                      animate={false}
                    />
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{entry.pontos_totais}</div>
                    <div className="text-white/60 text-xs">pontos</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top 3 dos Participantes */}
      {votosTop3.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
            🏆 Top 3 dos Usuários
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Veja quem cada jogador acha que vai ganhar o BBB
          </p>
          <div className="space-y-4">
            {votosTop3.map((voto) => {
              const isMyVote = voto.user_id === user?.id;
              return (
                <div
                  key={voto.id}
                  className={`bg-white/5 rounded-xl p-4 border ${
                    isMyVote
                      ? 'border-purple-500/50 ring-2 ring-purple-500/30'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">@{voto.username}</span>
                      {isMyVote && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-medium">
                          Você
                        </span>
                      )}
                    </div>
                    <span className="text-white/40 text-xs">
                      {new Date(voto.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1º Lugar */}
                    <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <span className="text-2xl">🥇</span>
                      <div className="flex-1">
                        <div className="text-yellow-200 text-xs font-medium">1º Lugar</div>
                        <div className="text-white font-bold text-sm">
                          {voto.primeiro?.nome || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* 2º Lugar */}
                    <div className="flex items-center gap-3 bg-gray-400/10 border border-gray-400/30 rounded-lg p-3">
                      <span className="text-2xl">🥈</span>
                      <div className="flex-1">
                        <div className="text-gray-200 text-xs font-medium">2º Lugar</div>
                        <div className="text-white font-bold text-sm">
                          {voto.segundo?.nome || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* 3º Lugar */}
                    <div className="flex items-center gap-3 bg-orange-600/10 border border-orange-600/30 rounded-lg p-3">
                      <span className="text-2xl">🥉</span>
                      <div className="flex-1">
                        <div className="text-orange-200 text-xs font-medium">3º Lugar</div>
                        <div className="text-white font-bold text-sm">
                          {voto.terceiro?.nome || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user && ranking.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">Sua posição no ranking</h3>
          {(() => {
            const myPosition = ranking.findIndex((r) => r.id === user.id);
            if (myPosition === -1) {
              return (
                <p className="text-white/70">Você ainda não tem pontos. Faça suas apostas!</p>
              );
            }
            const myData = ranking[myPosition];
            return (
              <div className="flex items-center gap-6 bg-white/5 rounded-xl p-4">
                <div className="text-4xl font-bold text-white">{getPosicao(myPosition)}º</div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/60 text-sm">Pontos</div>
                    <div className="text-white font-bold text-2xl">{myData.pontos_totais}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
