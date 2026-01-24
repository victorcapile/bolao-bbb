import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  totalApostas: number;
  totalAcertos: number;
  totalPontos: number;
  taxaAcerto: number;
  posicaoRanking: number;
  totalJogadores: number;
  sequenciaAcertos: number;
  melhorSequencia: number;
}

interface TipoStats {
  tipo: string;
  label: string;
  total: number;
  acertos: number;
  taxa: number;
}

interface ParticipanteVotado {
  id: string;
  nome: string;
  foto_url: string | null;
  vezes: number;
  acertos: number;
}

interface ProvaRecente {
  id: string;
  tipo: string;
  data: string;
  apostou: boolean;
  acertou: boolean | null;
  participante_nome?: string;
}

export default function Stats() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [tipoStats, setTipoStats] = useState<TipoStats[]>([]);
  const [maisVotados, setMaisVotados] = useState<ParticipanteVotado[]>([]);
  const [provasRecentes, setProvasRecentes] = useState<ProvaRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllStats();
    }
  }, [user]);

  const loadAllStats = async () => {
    if (!user) return;

    try {
      // Buscar dados do ranking
      const { data: rankingData } = await supabase
        .from('ranking')
        .select('*')
        .order('pontos_totais', { ascending: false });

      const userRanking = rankingData?.find(r => r.id === user.id);
      const posicao = rankingData?.findIndex(r => r.id === user.id) ?? -1;

      // Buscar apostas do usuário
      const { data: apostas } = await supabase
        .from('apostas')
        .select(`
          *,
          participante:participante_id (id, nome, foto_url),
          prova:prova_id (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!apostas) {
        setLoading(false);
        return;
      }

      // Calcular stats gerais
      const provasFechadas = apostas.filter((a: any) => a.prova?.fechada);
      const acertos = provasFechadas.filter((a: any) => a.prova?.vencedor_id === a.participante_id);

      // Calcular sequência de acertos
      let sequenciaAtual = 0;
      let melhorSequencia = 0;
      let tempSequencia = 0;

      const apostasOrdenadas = [...provasFechadas].sort((a: any, b: any) =>
        new Date(b.prova.data_prova).getTime() - new Date(a.prova.data_prova).getTime()
      );

      apostasOrdenadas.forEach((a: any) => {
        if (a.prova?.vencedor_id === a.participante_id) {
          tempSequencia++;
          if (tempSequencia > melhorSequencia) {
            melhorSequencia = tempSequencia;
          }
        } else {
          tempSequencia = 0;
        }
      });

      // Sequência atual (últimas apostas)
      for (const a of apostasOrdenadas as any[]) {
        if (a.prova?.vencedor_id === a.participante_id) {
          sequenciaAtual++;
        } else {
          break;
        }
      }

      setUserStats({
        totalApostas: apostas.length,
        totalAcertos: acertos.length,
        totalPontos: userRanking?.pontos_totais || 0,
        taxaAcerto: provasFechadas.length > 0 ? (acertos.length / provasFechadas.length) * 100 : 0,
        posicaoRanking: posicao + 1,
        totalJogadores: rankingData?.length || 0,
        sequenciaAcertos: sequenciaAtual,
        melhorSequencia,
      });

      // Stats por tipo
      const tipoMap: Record<string, { total: number; acertos: number }> = {};
      const tipoLabels: Record<string, string> = {
        lider: 'Líder',
        anjo: 'Anjo',
        paredao: 'Paredão',
        bate_volta: 'Bate e Volta',
        palpite_paredao: 'Palpite Paredão',
      };

      provasFechadas.forEach((a: any) => {
        const tipo = a.prova?.tipo;
        if (!tipoMap[tipo]) {
          tipoMap[tipo] = { total: 0, acertos: 0 };
        }
        tipoMap[tipo].total++;
        if (a.prova?.vencedor_id === a.participante_id) {
          tipoMap[tipo].acertos++;
        }
      });

      const tipoArray = Object.entries(tipoMap)
        .map(([tipo, data]) => ({
          tipo,
          label: tipoLabels[tipo] || tipo,
          total: data.total,
          acertos: data.acertos,
          taxa: data.total > 0 ? (data.acertos / data.total) * 100 : 0,
        }))
        .sort((a, b) => b.taxa - a.taxa);

      setTipoStats(tipoArray);

      // Participantes mais votados
      const votosMap: Record<string, ParticipanteVotado> = {};
      apostas.forEach((a: any) => {
        const p = a.participante;
        if (!p) return;
        if (!votosMap[p.id]) {
          votosMap[p.id] = {
            id: p.id,
            nome: p.nome,
            foto_url: p.foto_url,
            vezes: 0,
            acertos: 0,
          };
        }
        votosMap[p.id].vezes++;
        if (a.prova?.fechada && a.prova?.vencedor_id === p.id) {
          votosMap[p.id].acertos++;
        }
      });

      const votosArray = Object.values(votosMap)
        .sort((a, b) => b.vezes - a.vezes)
        .slice(0, 5);

      setMaisVotados(votosArray);

      // Provas recentes
      const recentes = apostas.slice(0, 5).map((a: any) => ({
        id: a.prova?.id,
        tipo: a.prova?.tipo,
        data: a.prova?.data_prova,
        apostou: true,
        acertou: a.prova?.fechada ? a.prova?.vencedor_id === a.participante_id : null,
        participante_nome: a.participante?.nome,
      }));

      setProvasRecentes(recentes);

    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      lider: 'Líder',
      anjo: 'Anjo',
      paredao: 'Paredão',
      bate_volta: 'Bate/Volta',
      palpite_paredao: 'Palpite',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass rounded-2xl px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Carregando estatísticas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-white/60">Faça suas primeiras apostas para ver suas estatísticas!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
          Suas Estatísticas
        </h1>
        <p className="text-white/50 text-sm">Acompanhe seu desempenho no bolão</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{userStats.totalPontos}</div>
          <div className="text-white/50 text-xs mt-1">Pontos</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{userStats.taxaAcerto.toFixed(0)}%</div>
          <div className="text-white/50 text-xs mt-1">Taxa de Acerto</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{userStats.posicaoRanking}º</div>
          <div className="text-white/50 text-xs mt-1">de {userStats.totalJogadores}</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{userStats.sequenciaAcertos}</div>
          <div className="text-white/50 text-xs mt-1">Sequência Atual</div>
        </div>
      </div>

      {/* Resumo */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-white/50">Apostas: </span>
              <span className="text-white font-medium">{userStats.totalApostas}</span>
            </div>
            <div>
              <span className="text-white/50">Acertos: </span>
              <span className="text-emerald-400 font-medium">{userStats.totalAcertos}</span>
            </div>
            <div>
              <span className="text-white/50">Melhor sequência: </span>
              <span className="text-orange-400 font-medium">{userStats.melhorSequencia}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Desempenho por tipo */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-white font-semibold mb-3 text-sm">Desempenho por Tipo</h2>
          {tipoStats.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma prova finalizada</p>
          ) : (
            <div className="space-y-2">
              {tipoStats.map((stat) => (
                <div key={stat.tipo} className="flex items-center gap-3">
                  <div className="w-20 text-white/70 text-xs">{stat.label}</div>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.taxa >= 60 ? 'bg-emerald-500' :
                        stat.taxa >= 40 ? 'bg-yellow-500' :
                          'bg-rose-500'
                        }`}
                      style={{ width: `${Math.max(stat.taxa, 5)}%` }}
                    />
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-xs font-medium ${stat.taxa >= 60 ? 'text-emerald-400' :
                      stat.taxa >= 40 ? 'text-yellow-400' :
                        'text-rose-400'
                      }`}>
                      {stat.taxa.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-10 text-white/40 text-xs text-right">
                    {stat.acertos}/{stat.total}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participantes favoritos */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-white font-semibold mb-3 text-sm">Seus Votos</h2>
          {maisVotados.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma aposta realizada</p>
          ) : (
            <div className="space-y-2">
              {maisVotados.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-5 text-white/30 text-xs">{idx + 1}.</div>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-6 h-6 rounded-full object-cover object-top" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10" />
                  )}
                  <div className="flex-1 text-white text-sm truncate">{p.nome}</div>
                  <div className="text-white/50 text-xs">{p.vezes}x</div>
                  {p.acertos > 0 && (
                    <div className="text-emerald-400 text-xs">{p.acertos} ✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Histórico recente */}
      <div className="glass rounded-xl p-4">
        <h2 className="text-white font-semibold mb-3 text-sm">Últimas Apostas</h2>
        {provasRecentes.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhuma aposta recente</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {provasRecentes.map((prova) => (
              <div
                key={prova.id}
                className={`flex-shrink-0 rounded-lg px-3 py-2 text-center min-w-[100px] ${prova.acertou === true ? 'bg-emerald-500/20 border border-emerald-500/30' :
                  prova.acertou === false ? 'bg-rose-500/20 border border-rose-500/30' :
                    'bg-white/5 border border-white/10'
                  }`}
              >
                <div className="text-white/70 text-[10px] uppercase tracking-wide">
                  {getTipoLabel(prova.tipo)}
                </div>
                <div className="text-white text-xs font-medium mt-1 truncate">
                  {prova.participante_nome}
                </div>
                <div className="mt-1">
                  {prova.acertou === true && <span className="text-emerald-400 text-xs">Acertou</span>}
                  {prova.acertou === false && <span className="text-rose-400 text-xs">Errou</span>}
                  {prova.acertou === null && <span className="text-white/40 text-xs">Aguardando</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
