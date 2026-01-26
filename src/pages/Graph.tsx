import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PontoHistorico {
  data: string;
  [username: string]: string | number;
}

export default function Graph() {
  const [dados, setDados] = useState<PontoHistorico[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricoPontos();
  }, []);

  const loadHistoricoPontos = async () => {
    try {
      // Buscar todas as apostas com pontos e suas datas
      const { data: apostasData, error: apostasError } = await supabase
        .from('apostas')
        .select(`
          user_id,
          pontos,
          created_at,
          provas!inner(data_prova)
        `)
        .order('created_at', { ascending: true });

      if (apostasError) throw apostasError;

      // Buscar nomes dos usuários
      const userIds = [...new Set(apostasData?.map(a => a.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const userMap = new Map(profilesData?.map(p => [p.id, p.username]) || []);
      const usernames = Array.from(userMap.values());
      setUsuarios(usernames);

      // Agrupar pontos por data e usuário
      const pontosPorData: Record<string, Record<string, number>> = {};

      apostasData?.forEach(aposta => {
        if (aposta.pontos > 0) {
          const data = new Date(aposta.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          });
          const username = userMap.get(aposta.user_id) || 'Desconhecido';

          if (!pontosPorData[data]) {
            pontosPorData[data] = {};
            usernames.forEach(u => {
              pontosPorData[data][u] = 0;
            });
          }

          pontosPorData[data][username] = (pontosPorData[data][username] || 0) + aposta.pontos;
        }
      });

      // Calcular pontos acumulados
      const pontosAcumulados: Record<string, number> = {};
      usernames.forEach(u => {
        pontosAcumulados[u] = 0;
      });

      const dadosGrafico: PontoHistorico[] = Object.entries(pontosPorData)
        .map(([data, pontos]) => {
          const ponto: PontoHistorico = { data };

          usernames.forEach(username => {
            pontosAcumulados[username] += pontos[username] || 0;
            ponto[username] = pontosAcumulados[username];
          });

          return ponto;
        });

      setDados(dadosGrafico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const cores = [
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#a855f7', // violet
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Evolução de Pontos
        </h1>
        <p className="text-white/70 text-sm">Acompanhe a evolução dos pontos ao longo do tempo</p>
      </div>

      {dados.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-white/60 text-lg">Nenhum dado de pontuação disponível ainda</p>
          <p className="text-white/40 text-sm mt-2">Os dados aparecerão após as primeiras apostas pontuadas</p>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6">
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="data"
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              {usuarios.map((username, index) => (
                <Line
                  key={username}
                  type="monotone"
                  dataKey={username}
                  stroke={cores[index % cores.length]}
                  strokeWidth={2}
                  dot={{ fill: cores[index % cores.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
