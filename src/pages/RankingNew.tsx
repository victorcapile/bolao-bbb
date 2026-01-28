import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RankingEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import NivelBadge from '../components/NivelBadge';

export default function RankingNew() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('pontos_totais', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxPontos = ranking[0]?.pontos_totais || 1;

  const getMedalha = (posicao: number) => {
    if (posicao === 1) return { emoji: '🥇', cor: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-500/50' };
    if (posicao === 2) return { emoji: '🥈', cor: 'from-gray-300 to-gray-400', shadow: 'shadow-gray-400/50' };
    if (posicao === 3) return { emoji: '🥉', cor: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/50' };
    return null;
  };

  const getCorBarra = (posicao: number) => {
    if (posicao === 1) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    if (posicao === 2) return 'from-gray-400 via-gray-500 to-gray-600';
    if (posicao === 3) return 'from-orange-400 via-orange-500 to-orange-600';
    return 'from-purple-500 via-purple-600 to-pink-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-3">
          <span className="text-5xl">🏆</span>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            Ranking
          </h1>
          <span className="text-5xl">🏆</span>
        </div>
        <p className="text-white/60 text-sm md:text-base">
          Acompanhe quem está dominando o bolão!
        </p>
      </div>

      {/* Pódio (Top 3) */}
      {ranking.length >= 3 && (
        <div className="mb-12">
          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto items-end">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-2xl p-3 md:p-6 border-2 border-gray-400/30 shadow-2xl transform translate-y-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl mb-2">🥈</div>
                  {ranking[1].avatar_url ? (
                    <img
                      src={ranking[1].avatar_url}
                      alt={ranking[1].username}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-3 border-4 border-gray-400 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl md:text-2xl border-4 border-gray-400 shadow-xl">
                      {ranking[1].username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-white font-bold text-sm md:text-base mb-1 truncate">
                    @{ranking[1].username}
                  </h3>
                  <div className="flex justify-center mb-2">
                    <NivelBadge nivel={ranking[1].nivel} size="sm" />
                  </div>
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-2xl md:text-3xl font-black text-gray-300">
                      {ranking[1].pontos_totais}
                    </p>
                    <p className="text-xs text-gray-400">pontos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1º Lugar */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-t-2xl p-4 md:p-8 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/30 relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 px-4 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">
                  👑 CAMPEÃO
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl md:text-7xl mb-3 animate-bounce">🥇</div>
                  {ranking[0].avatar_url ? (
                    <img
                      src={ranking[0].avatar_url}
                      alt={ranking[0].username}
                      className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto mb-4 border-4 border-yellow-400 object-cover shadow-2xl ring-4 ring-yellow-500/30"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl md:text-4xl border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-500/30">
                      {ranking[0].username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-white font-black text-base md:text-xl mb-2 truncate">
                    @{ranking[0].username}
                  </h3>
                  <div className="flex justify-center mb-3">
                    <NivelBadge nivel={ranking[0].nivel} size="md" />
                  </div>
                  <div className="bg-yellow-900/50 rounded-xl px-4 py-3">
                    <p className="text-3xl md:text-5xl font-black text-yellow-200">
                      {ranking[0].pontos_totais}
                    </p>
                    <p className="text-xs md:text-sm text-yellow-300">pontos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-gradient-to-b from-orange-800 to-orange-900 rounded-t-2xl p-3 md:p-6 border-2 border-orange-400/30 shadow-2xl transform translate-y-12">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl mb-2">🥉</div>
                  {ranking[2].avatar_url ? (
                    <img
                      src={ranking[2].avatar_url}
                      alt={ranking[2].username}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-3 border-4 border-orange-400 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl md:text-2xl border-4 border-orange-400 shadow-xl">
                      {ranking[2].username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-white font-bold text-sm md:text-base mb-1 truncate">
                    @{ranking[2].username}
                  </h3>
                  <div className="flex justify-center mb-2">
                    <NivelBadge nivel={ranking[2].nivel} size="sm" />
                  </div>
                  <div className="bg-orange-700/50 rounded-lg px-3 py-2">
                    <p className="text-2xl md:text-3xl font-black text-orange-300">
                      {ranking[2].pontos_totais}
                    </p>
                    <p className="text-xs text-orange-400">pontos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista do Ranking (a partir do 4º) */}
      <div className="glass rounded-2xl p-4 md:p-6">
        <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Ranking Completo</span>
        </h2>

        <div className="space-y-3">
          {ranking.map((entry, index) => {
            const posicao = index + 1;
            const medalha = getMedalha(posicao);
            const larguraBarra = (entry.pontos_totais / maxPontos) * 100;
            const isCurrentUser = user?.id === entry.id;

            return (
              <div
                key={entry.id}
                className={`relative rounded-xl overflow-hidden transition-all ${
                  isCurrentUser
                    ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20'
                    : 'hover:scale-[1.02]'
                }`}
              >
                {/* Barra de progresso */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getCorBarra(posicao)} opacity-20 transition-all duration-1000`}
                    style={{ width: `${larguraBarra}%` }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="relative glass-dark p-3 md:p-4 flex items-center gap-3 md:gap-4">
                  {/* Posição */}
                  <div className="flex-shrink-0 w-12 md:w-14 text-center">
                    {medalha ? (
                      <div className={`text-3xl md:text-4xl drop-shadow-lg`}>
                        {medalha.emoji}
                      </div>
                    ) : (
                      <div className="text-white/40 font-black text-xl md:text-2xl">
                        {posicao}
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg md:text-xl border-2 border-white/20">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm md:text-base truncate">
                        @{entry.username}
                      </h3>
                      {isCurrentUser && (
                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <NivelBadge nivel={entry.nivel} size="xs" />
                      {entry.total_apostas > 0 && (
                        <span className="text-xs text-white/50">
                          {entry.acertos}/{entry.total_apostas} acertos
                          <span className="text-green-400 ml-1">
                            ({Math.round((entry.acertos / entry.total_apostas) * 100)}%)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pontos */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-white font-black text-xl md:text-2xl">
                      {entry.pontos_totais}
                    </p>
                    <p className="text-white/40 text-xs">pontos</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
