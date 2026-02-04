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
    async function fetchRanking() {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('pontos_totais', { ascending: false });
      if (!error && data) {
        setRanking(data);
      }
      setLoading(false);
    }
    fetchRanking();
  }, []);

  // Funções auxiliares (mock)
  function getMedalha(posicao: number) {
    if (posicao === 1) return { emoji: '🥇' };
    if (posicao === 2) return { emoji: '🥈' };
    if (posicao === 3) return { emoji: '🥉' };
    return null;
  }
  function getCorBarra(posicao: number) {
    if (posicao === 1) return 'from-yellow-400 to-yellow-700';
    if (posicao === 2) return 'from-slate-400 to-slate-700';
    if (posicao === 3) return 'from-orange-400 to-orange-900';
    return 'from-purple-400 to-pink-700';
  }

  const maxPontos = ranking.length > 0 ? ranking[0].pontos_totais : 1;

  return (
    <div className="ranking-page">
      {/* Pódio (Top 3) */}
      {ranking.length >= 3 && (
        <div className="mb-20 mt-10">
          {/* Mobile-friendly simplified podium (only on small screens) */}
          <div className="md:hidden max-w-md mx-auto px-4 sm:px-6 space-y-4">
            <div className="relative bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-2xl p-4 border-2 border-yellow-400 shadow-lg flex items-center gap-4">
              <div className="text-3xl">👑</div>
              <div>
                <div className="text-white font-extrabold text-lg">@{ranking[0].username}</div>
                <div className="text-yellow-100 font-black text-xl">{ranking[0].pontos_totais} pts</div>
                <div className="mt-1"><NivelBadge nivel={ranking[0].nivel} size="sm" /></div>
              </div>
              <div className="ml-auto">
                {ranking[0].avatar_url ? (
                  <img src={ranking[0].avatar_url} alt={ranking[0].username} className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl border-2 border-yellow-400">{ranking[0].username.charAt(0).toUpperCase()}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <div className="text-2xl">🥈</div>
                <div>
                  <div className="text-white font-bold">@{ranking[1].username}</div>
                  <div className="text-sm text-white/80">{ranking[1].pontos_totais} pts</div>
                </div>
                <div className="ml-auto">
                  {ranking[1].avatar_url ? (
                    <img src={ranking[1].avatar_url} alt={ranking[1].username} className="w-10 h-10 rounded-full border-2 border-slate-600 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">{ranking[1].username.charAt(0).toUpperCase()}</div>
                  )}
                </div>
              </div>

              <div className="bg-orange-900 rounded-xl p-3 flex items-center gap-3">
                <div className="text-2xl">🥉</div>
                <div>
                  <div className="text-white font-bold">@{ranking[2].username}</div>
                  <div className="text-sm text-white/80">{ranking[2].pontos_totais} pts</div>
                </div>
                <div className="ml-auto">
                  {ranking[2].avatar_url ? (
                    <img src={ranking[2].avatar_url} alt={ranking[2].username} className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">{ranking[2].username.charAt(0).toUpperCase()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop / md+ podium (kept as-is) */}
          <div className="hidden md:block">
            <div className="max-w-5xl mx-auto grid grid-cols-3 items-end gap-4 px-4 sm:px-6">
              {/* 2º Lugar (left on md) */}
              <div className="flex justify-center md:translate-y-4">
                <div className="relative w-full md:w-[260px] bg-gradient-to-b from-slate-800 to-slate-700 rounded-2xl p-5 border border-slate-600/40 shadow-2xl flex flex-col items-center">
                  <div className="absolute -top-5 left-4 bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900 px-4 py-1 rounded-full text-sm md:text-base font-bold shadow">🥈 2º</div>
                  <div className="mb-2 text-2xl md:text-3xl">🥈</div>
                  {/* Foto removida do 2º lugar */}
                  <h3 className="text-white font-bold text-sm md:text-base mt-2 truncate">@{ranking[1].username}</h3>
                  <div className="mt-2"><NivelBadge nivel={ranking[1].nivel} size="md" /></div>
                  <div className="mt-3 bg-white/6 text-white/90 px-3 py-1 rounded-full text-sm md:text-base font-extrabold">{ranking[1].pontos_totais} pts</div>
                </div>
              </div>

              {/* 1º Lugar (center) */}
              <div className="flex justify-center md:-translate-y-6">
                <div className="relative w-full md:w-[360px] bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-3xl p-6 border-2 border-yellow-400 shadow-2xl flex flex-col items-center">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 px-4 py-1 rounded-full text-sm md:text-base font-extrabold shadow-lg">👑 CAMPEÃO</div>
                  <div className="mb-2 text-4xl md:text-6xl animate-bounce">🥇</div>
                  {ranking[0].avatar_url ? (
                    <img src={ranking[0].avatar_url} alt={ranking[0].username} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 object-cover shadow-2xl ring-4 ring-yellow-400/30" />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/30">{ranking[0].username.charAt(0).toUpperCase()}</div>
                  )}
                  <h3 className="text-white font-extrabold text-base md:text-lg mt-2 truncate">@{ranking[0].username}</h3>
                  <div className="mt-2"><NivelBadge nivel={ranking[0].nivel} size="md" /></div>
                  <div className="mt-3 bg-yellow-900/60 text-yellow-100 px-4 py-2 rounded-full text-xl md:text-3xl font-black">{ranking[0].pontos_totais}</div>
                  <div className="text-yellow-200 text-xs mt-1">pontos</div>
                </div>
              </div>

              {/* 3º Lugar (right on md) */}
              <div className="flex justify-center md:translate-y-6">
                <div className="relative w-full md:w-[220px] bg-gradient-to-b from-orange-800 to-orange-900 rounded-2xl p-4 border border-orange-700/30 shadow-md flex flex-col items-center">
                  <div className="absolute -top-4 right-4 bg-gradient-to-r from-orange-200 to-orange-300 text-orange-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm">🥉 3º</div>
                  <div className="mb-2 text-2xl md:text-3xl">🥉</div>
                  {/* Foto removida do 3º lugar */}
                  <h3 className="text-white font-bold text-sm mt-3 truncate">@{ranking[2].username}</h3>
                  <div className="mt-2"><NivelBadge nivel={ranking[2].nivel} size="sm" /></div>
                  <div className="mt-3 bg-white/5 text-white/80 px-3 py-1 rounded-full text-sm font-bold">{ranking[2].pontos_totais} pts</div>
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
