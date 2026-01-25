import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Prova, Participante, Aposta } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useXP } from '../contexts/XPContext';
import ProvaCarousel from '../components/ProvaCarousel';

interface ProvaComDetalhes extends Prova {
  vencedor?: Participante;
  aposta?: Aposta;
  apostas?: Aposta[];
  participante_apostado?: Participante;
  emparedados?: string[];
}

export default function Apostas() {
  const [provas, setProvas] = useState<ProvaComDetalhes[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [apostando, setApostando] = useState<string | null>(null);
  const { user } = useAuth();
  const { triggerXPAnimation } = useXP();

  useEffect(() => {
    loadProvas();
    loadParticipantes();
  }, [user]);

  const getTipoProvaOrdem = (tipo: string): number => {
    const ordem = {
      bate_volta: 1,
      paredao: 2,
      palpite_paredao: 3,
      lider: 4,
      anjo: 5,
    };
    return ordem[tipo as keyof typeof ordem] || 999;
  };

  const loadProvas = async () => {
    try {
      const { data: provasData, error } = await supabase
        .from('provas')
        .select('*')
        .eq('arquivada', false)
        .order('data_prova', { ascending: false });

      if (error) throw error;

      // Carregar emparedados para cada prova
      await supabase
        .from('emparedados')
        .select('prova_id, participante_id');

      if (user) {
        const { data: apostasData, error: apostasError } = await supabase
          .from('apostas')
          .select('*, participantes(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (apostasError) {
          console.error('Erro ao carregar apostas:', apostasError);
        }

        const provasComApostas = provasData.map((prova) => {
          const apostasProva = apostasData?.filter((a) => a.prova_id === prova.id) || [];
          const aposta = apostasProva[0];

          // Limpar apostas para garantir que temos os campos corretos
          const apostasLimpas = apostasProva.map(a => ({
            id: a.id,
            user_id: a.user_id,
            prova_id: a.prova_id,
            participante_id: a.participante_id,
            pontos: a.pontos,
            created_at: a.created_at
          }));

          return {
            ...prova,
            aposta: aposta ? {
              id: aposta.id,
              user_id: aposta.user_id,
              prova_id: aposta.prova_id,
              participante_id: aposta.participante_id,
              pontos: aposta.pontos,
              created_at: aposta.created_at
            } : undefined,
            apostas: apostasLimpas.length > 0 ? apostasLimpas : undefined,
            participante_apostado: aposta?.participantes || undefined,
            emparedados: [],
          };
        });

        // Ordenar: abertas primeiro, depois por tipo
        provasComApostas.sort((a, b) => {
          // Primeiro: abertas antes de fechadas
          if (a.fechada !== b.fechada) return a.fechada ? 1 : -1;
          // Depois: por tipo
          return getTipoProvaOrdem(a.tipo) - getTipoProvaOrdem(b.tipo);
        });

        setProvas(provasComApostas);
      } else {
        const provasOrdenadas = provasData.map(prova => ({
          ...prova,
          emparedados: [],
        }));

        // Ordenar: abertas primeiro, depois por tipo
        provasOrdenadas.sort((a, b) => {
          if (a.fechada !== b.fechada) return a.fechada ? 1 : -1;
          return getTipoProvaOrdem(a.tipo) - getTipoProvaOrdem(b.tipo);
        });

        setProvas(provasOrdenadas);
      }
    } catch (error) {
      console.error('Erro ao carregar provas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantes = async () => {
    try {
      const { data, error } = await supabase
        .from('participantes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setParticipantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    }
  };

  const fazerAposta = async (provaId: string, participanteId: string) => {
    if (!user) return;

    // Verificar se a votação está aberta
    const prova = provas.find((p) => p.id === provaId);
    if (prova && !prova.votacao_aberta) {
      alert('⚠️ A votação para esta prova foi encerrada! Não é mais possível fazer apostas.');
      return;
    }

    setApostando(provaId);
    try {
      const isPalpiteParedao = prova?.tipo === 'palpite_paredao';
      const apostasAtuais = prova?.apostas || [];

      // Verificar se já votou nesse participante
      const jaVotouNeste = apostasAtuais.some(a => a.participante_id === participanteId);

      if (jaVotouNeste) {
        // Se já votou, remove o voto (toggle)
        const apostaExistente = apostasAtuais.find(a => a.participante_id === participanteId);

        console.log('🗑️ Tentando deletar aposta:', apostaExistente);

        if (apostaExistente && apostaExistente.id) {
          const { error, data } = await supabase
            .from('apostas')
            .delete()
            .eq('id', apostaExistente.id)
            .select();

          console.log('📤 Resultado do DELETE:', { error, data, id: apostaExistente.id });

          if (error) {
            console.error('❌ Erro ao deletar:', error);
            throw error;
          }

          console.log('✅ DELETE bem sucedido, atualizando UI');

          // Atualização otimista - remove do estado local imediatamente
          setProvas(prevProvas => prevProvas.map(p => {
            if (p.id === provaId && p.apostas) {
              const novasApostas = p.apostas.filter(a => a.id !== apostaExistente.id);
              console.log('🔄 Atualizando estado:', {
                antes: p.apostas.length,
                depois: novasApostas.length
              });
              return {
                ...p,
                apostas: novasApostas.length > 0 ? novasApostas : undefined,
              };
            }
            return p;
          }));

          // Aguardar o banco processar o DELETE antes de continuar
          console.log('⏳ Aguardando 300ms para garantir commit do DELETE...');
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('✅ Delay concluído, pronto para novo voto');
        } else {
          console.error('⚠️ Aposta sem ID:', apostaExistente);
          throw new Error('ID da aposta não encontrado');
        }
      } else {
        // Se não votou ainda
        if (isPalpiteParedao) {
          // Para palpite_paredao, permite até 3 votos (inserir novo)
          console.log('➕ Tentando adicionar novo voto');
          const { data, error } = await supabase
            .from('apostas')
            .insert({
              user_id: user.id,
              prova_id: provaId,
              participante_id: participanteId,
            })
            .select()
            .single();

          console.log('📤 Resultado do INSERT:', { error, data });

          if (error) {
            console.error('❌ Erro ao inserir:', error);
            throw error;
          }

          console.log('✅ INSERT bem sucedido, atualizando UI');

          // Trigger animação de XP
          triggerXPAnimation();

          // Atualização otimista - adiciona ao estado local imediatamente
          if (data) {
            setProvas(prevProvas => prevProvas.map(p => {
              if (p.id === provaId) {
                const novaAposta = {
                  id: data.id,
                  user_id: data.user_id,
                  prova_id: data.prova_id,
                  participante_id: data.participante_id,
                  pontos: data.pontos,
                  created_at: data.created_at
                };
                console.log('🔄 Adicionando ao estado:', {
                  antes: (p.apostas || []).length,
                  depois: [...(p.apostas || []), novaAposta].length
                });
                return {
                  ...p,
                  apostas: [...(p.apostas || []), novaAposta],
                };
              }
              return p;
            }));
          }
        } else {
          // Para outras provas, apenas 1 voto (update ou insert)
          if (prova?.aposta) {
            const { error } = await supabase
              .from('apostas')
              .update({ participante_id: participanteId })
              .eq('id', prova.aposta.id);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('apostas')
              .insert({
                user_id: user.id,
                prova_id: provaId,
                participante_id: participanteId,
              });

            if (error) throw error;

            // Trigger animação de XP para novo voto
            triggerXPAnimation();
          }

          // Recarregar para provas que não são palpite_paredao
          await loadProvas();
        }
      }
    } catch (error) {
      console.error('Erro ao fazer aposta:', error);
      alert('Erro ao fazer aposta. Tente novamente.');
      // Em caso de erro, recarrega para garantir sincronização
      await loadProvas();
    } finally {
      setApostando(null);
    }
  };

  const getTipoProvaLabel = (tipo: string) => {
    const labels = {
      lider: 'Prova do Líder',
      anjo: 'Prova do Anjo',
      bate_volta: 'Bate e Volta',
      paredao: 'Paredão',
      palpite_paredao: 'Palpite: Próximo Paredão',
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoProvaColor = (tipo: string) => {
    const colors = {
      lider: 'from-yellow-500 to-orange-500',
      anjo: 'from-blue-400 to-cyan-400',
      bate_volta: 'from-green-400 to-emerald-400',
      paredao: 'from-red-500 to-pink-500',
      palpite_paredao: 'from-purple-400 to-pink-400',
    };
    return colors[tipo as keyof typeof colors] || 'from-purple-500 to-pink-500';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getParticipantesParaProva = (prova: ProvaComDetalhes): Participante[] => {
    // Para paredão e bate e volta, mostrar apenas os emparedados
    if (prova.tipo === 'paredao' || prova.tipo === 'bate_volta') {
      const emparedados = prova.emparedados || [];
      return participantes.filter(p => emparedados.includes(p.id));
    }
    // Para palpite de paredão, excluir líder e anjo atual
    if (prova.tipo === 'palpite_paredao') {
      return participantes.filter(p => !p.is_lider_atual && !p.is_anjo_atual);
    }
    // Para líder e anjo, mostrar todos os participantes ativos
    return participantes;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-pink-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-pink-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <div className="glass rounded-xl px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-white text-sm font-medium ml-2">Carregando apostas</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full mx-auto px-2 sm:px-4">
      <ProvaCarousel
        provas={provas}
        getParticipantesParaProva={getParticipantesParaProva}
        fazerAposta={fazerAposta}
        apostando={apostando}
        getTipoProvaLabel={getTipoProvaLabel}
        getTipoProvaColor={getTipoProvaColor}
        formatDate={formatDate}
      />
    </div>
  );
}
