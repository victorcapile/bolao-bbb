import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import type { Participante, Prova } from '../lib/supabase';

export default function Admin() {
  const { profile } = useAuth();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaProva, setNovaProva] = useState({
    tipo: '',
    data_prova: '',
    descricao: '',
    tipo_customizado: false,
    titulo_customizado: '',
    max_escolhas: 1
  });
  const [novoParticipante, setNovoParticipante] = useState({ nome: '', foto_url: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [{ data: participantesData }, { data: provasData }] = await Promise.all([
        supabase.from('participantes').select('*').order('nome'),
        supabase.from('provas').select('*').order('data_prova', { ascending: false }),
      ]);

      setParticipantes(participantesData || []);
      setProvas(provasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipanteAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('participantes')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar participante:', error);
    }
  };

  const fecharProva = async (provaId: string, vencedorId: string) => {
    try {
      const { error } = await supabase
        .from('provas')
        .update({ fechada: true, vencedor_id: vencedorId })
        .eq('id', provaId);

      if (error) throw error;
      alert('Prova fechada com sucesso! ✅');
      loadData();
    } catch (error) {
      console.error('Erro ao fechar prova:', error);
      alert('Erro ao fechar prova');
    }
  };

  const criarProva = async () => {
    if (!novaProva.data_prova) {
      alert('Preencha a data da prova');
      return;
    }

    if (novaProva.tipo_customizado) {
      if (!novaProva.titulo_customizado) {
        alert('Preencha o título da prova customizada');
        return;
      }
    } else {
      if (!novaProva.tipo) {
        alert('Selecione o tipo da prova');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('provas')
        .insert({
          tipo: novaProva.tipo_customizado ? 'lider' : novaProva.tipo,
          data_prova: novaProva.data_prova,
          descricao: novaProva.descricao || null,
          fechada: false,
          tipo_customizado: novaProva.tipo_customizado,
          titulo_customizado: novaProva.tipo_customizado ? novaProva.titulo_customizado : null,
          max_escolhas: novaProva.max_escolhas,
        });

      if (error) throw error;
      alert('Prova criada com sucesso! ✅');
      setNovaProva({
        tipo: '',
        data_prova: '',
        descricao: '',
        tipo_customizado: false,
        titulo_customizado: '',
        max_escolhas: 1
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar prova:', error);
      alert('Erro ao criar prova');
    }
  };

  const definirLider = async (participanteId: string) => {
    try {
      // Remover líder atual
      await supabase.from('participantes').update({ is_lider_atual: false }).neq('id', '00000000-0000-0000-0000-000000000000');

      // Definir novo líder
      const { error } = await supabase
        .from('participantes')
        .update({ is_lider_atual: true })
        .eq('id', participanteId);

      if (error) throw error;
      alert('Líder definido com sucesso! 👑');
      loadData();
    } catch (error) {
      console.error('Erro ao definir líder:', error);
      alert('Erro ao definir líder');
    }
  };

  const definirAnjo = async (participanteId: string) => {
    try {
      // Remover anjo atual
      await supabase.from('participantes').update({ is_anjo_atual: false }).neq('id', '00000000-0000-0000-0000-000000000000');

      // Definir novo anjo
      const { error } = await supabase
        .from('participantes')
        .update({ is_anjo_atual: true })
        .eq('id', participanteId);

      if (error) throw error;
      alert('Anjo definido com sucesso! 😇');
      loadData();
    } catch (error) {
      console.error('Erro ao definir anjo:', error);
      alert('Erro ao definir anjo');
    }
  };

  const toggleImunidade = async (participanteId: string, statusAtual: boolean = false) => {
    try {
      const { error } = await supabase
        .from('participantes')
        .update({ is_imune_atual: !statusAtual })
        .eq('id', participanteId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao alternar imunidade:', error);
      alert('Erro ao alternar imunidade');
    }
  };

  const adicionarParticipante = async () => {
    if (!novoParticipante.nome) {
      alert('Preencha o nome do participante');
      return;
    }

    try {
      const { error } = await supabase
        .from('participantes')
        .insert({
          nome: novoParticipante.nome,
          foto_url: novoParticipante.foto_url || null,
          ativo: true,
          is_lider_atual: false,
          is_anjo_atual: false,
        });

      if (error) throw error;
      alert('Participante adicionado com sucesso! ✅');
      setNovoParticipante({ nome: '', foto_url: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      alert('Erro ao adicionar participante');
    }
  };

  const reabrirProva = async (provaId: string) => {
    if (!confirm('Tem certeza que deseja reabrir esta prova? Isso permitirá novas apostas.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('provas')
        .update({ fechada: false, vencedor_id: null })
        .eq('id', provaId);

      if (error) throw error;
      alert('Prova reaberta com sucesso! 🔓');
      loadData();
    } catch (error) {
      console.error('Erro ao reabrir prova:', error);
      alert('Erro ao reabrir prova');
    }
  };

  const arquivarProva = async (provaId: string) => {
    if (!confirm('Tem certeza que deseja arquivar esta prova? Ela não aparecerá mais na lista de apostas.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('provas')
        .update({ arquivada: true })
        .eq('id', provaId);

      if (error) throw error;
      alert('Prova arquivada com sucesso! 📦');
      loadData();
    } catch (error) {
      console.error('Erro ao arquivar prova:', error);
      alert('Erro ao arquivar prova');
    }
  };

  const deletarProva = async (provaId: string) => {
    if (!confirm('⚠️ ATENÇÃO: Tem certeza que deseja DELETAR esta prova? Esta ação é IRREVERSÍVEL e apagará todas as apostas relacionadas!')) {
      return;
    }

    try {
      // Primeiro deletar as apostas relacionadas
      await supabase.from('apostas').delete().eq('prova_id', provaId);

      // Depois deletar a prova
      const { error } = await supabase
        .from('provas')
        .delete()
        .eq('id', provaId);

      if (error) throw error;
      alert('Prova deletada com sucesso! 🗑️');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      alert('Erro ao deletar prova');
    }
  };

  const toggleVotacao = async (provaId: string, votacaoAtual: boolean) => {
    const acao = votacaoAtual ? 'fechar' : 'abrir';
    const mensagem = votacaoAtual
      ? 'Tem certeza que deseja FECHAR a votação? Usuários não poderão mais fazer apostas nesta prova.'
      : 'Tem certeza que deseja ABRIR a votação? Usuários poderão fazer novas apostas.';

    if (!confirm(mensagem)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('provas')
        .update({ votacao_aberta: !votacaoAtual })
        .eq('id', provaId);

      if (error) throw error;
      alert(`Votação ${acao === 'fechar' ? 'fechada' : 'aberta'} com sucesso! ${votacaoAtual ? '🔒' : '🔓'}`);
      loadData();
    } catch (error) {
      console.error('Erro ao alterar votação:', error);
      alert('Erro ao alterar votação');
    }
  };

  if (!profile?.is_admin) {
    return <Navigate to="/" />;
  }

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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Painel Admin
        </h1>
        <p className="text-white/70">Gerencie participantes e provas</p>
      </div>

      {/* Formulários Compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Criar Nova Prova */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-bold text-white mb-3">➕ Criar Prova</h2>
          <div className="space-y-2">
            {/* Toggle: Prova Padrão ou Customizada */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setNovaProva({ ...novaProva, tipo_customizado: false, titulo_customizado: '', max_escolhas: 1 })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  !novaProva.tipo_customizado
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Prova Padrão
              </button>
              <button
                onClick={() => setNovaProva({ ...novaProva, tipo_customizado: true, tipo: '' })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  novaProva.tipo_customizado
                    ? 'bg-pink-500/30 text-pink-200 border border-pink-500/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Prova Customizada
              </button>
            </div>

            {/* Campos para Prova Padrão */}
            {!novaProva.tipo_customizado && (
              <select
                value={novaProva.tipo}
                onChange={(e) => setNovaProva({ ...novaProva, tipo: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tipo *</option>
                <option value="lider">Líder</option>
                <option value="anjo">Anjo</option>
                <option value="bate_volta">Bate e Volta</option>
              </select>
            )}

            {/* Campos para Prova Customizada */}
            {novaProva.tipo_customizado && (
              <>
                <input
                  type="text"
                  value={novaProva.titulo_customizado}
                  onChange={(e) => setNovaProva({ ...novaProva, titulo_customizado: e.target.value })}
                  placeholder="Ex: Quem vai brigar na próxima festa?"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <select
                  value={novaProva.max_escolhas}
                  onChange={(e) => setNovaProva({ ...novaProva, max_escolhas: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="1">1 pessoa</option>
                  <option value="2">2 pessoas</option>
                  <option value="3">3 pessoas</option>
                </select>
              </>
            )}

            {/* Descrição (opcional) */}
            <input
              type="text"
              value={novaProva.descricao}
              onChange={(e) => setNovaProva({ ...novaProva, descricao: e.target.value })}
              placeholder="Descrição (opcional)"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Data da Prova */}
            <input
              type="date"
              value={novaProva.data_prova}
              onChange={(e) => setNovaProva({ ...novaProva, data_prova: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              onClick={criarProva}
              className="w-full py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all"
            >
              Criar Prova
            </button>
          </div>
        </div>

        {/* Adicionar Participante */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-bold text-white mb-3">➕ Adicionar Participante</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={novoParticipante.nome}
              onChange={(e) => setNovoParticipante({ ...novoParticipante, nome: e.target.value })}
              placeholder="Nome do participante *"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={novoParticipante.foto_url}
              onChange={(e) => setNovoParticipante({ ...novoParticipante, foto_url: e.target.value })}
              placeholder="URL da Foto (opcional)"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={adicionarParticipante}
              className="w-full py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all"
            >
              Adicionar Participante
            </button>
          </div>
        </div>
      </div>

      {/* Participantes */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">👥 Participantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantes.map((participante) => {
            const isLider = participante.is_lider_atual;
            const isAnjo = participante.is_anjo_atual;

            let bgClass = 'bg-white/5 border-white/10';
            if (!participante.ativo) {
              bgClass = 'bg-red-500/10 border-red-500/30 opacity-60';
            } else if (isLider) {
              bgClass = 'bg-gradient-to-br from-purple-500/40 to-purple-600/30 border-purple-400 shadow-2xl shadow-purple-500/50 ring-2 ring-purple-400/50';
            } else if (isAnjo) {
              bgClass = 'bg-gradient-to-br from-pink-500/40 to-pink-600/30 border-pink-400 shadow-2xl shadow-pink-500/50 ring-2 ring-pink-400/50';
            }

            return (
              <div
                key={participante.id}
                className={`p-4 rounded-xl border-2 transition-all ${bgClass}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {participante.foto_url && (
                    <img
                      src={participante.foto_url}
                      alt={participante.nome}
                      className="w-12 h-12 rounded-full object-cover object-top"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{participante.nome}</h3>
                      {participante.is_lider_atual && <span className="text-lg">👑</span>}
                      {participante.is_anjo_atual && <span className="text-lg">😇</span>}
                    </div>
                    <p className="text-white/60 text-sm">
                      {participante.ativo ? 'Ativo' : 'Eliminado'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {participante.ativo && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => definirLider(participante.id)}
                        className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all ${participante.is_lider_atual
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                          : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                          }`}
                      >
                        👑 Líder
                      </button>
                      <button
                        onClick={() => definirAnjo(participante.id)}
                        className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all ${participante.is_anjo_atual
                          ? 'bg-pink-500/30 text-pink-200 border border-pink-500/50'
                          : 'bg-pink-500/10 text-pink-300 hover:bg-pink-500/20'
                          }`}
                      >
                        😇 Anjo
                      </button>
                      <button
                        onClick={() => toggleImunidade(participante.id, participante.is_imune_atual)}
                        className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all col-span-2 ${participante.is_imune_atual
                          ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                          : 'bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                          }`}
                      >
                        🛡️ Imunizar
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => toggleParticipanteAtivo(participante.id, participante.ativo)}
                    className={`w-full py-2 rounded-lg font-medium transition-all ${participante.ativo
                      ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-200 hover:bg-green-500/30'
                      }`}
                  >
                    {participante.ativo ? 'Eliminar' : 'Reativar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provas Abertas */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">🏆 Provas Abertas</h2>
        {provas.filter((p) => !p.fechada).length === 0 ? (
          <p className="text-white/60 text-center py-8">Nenhuma prova aberta no momento</p>
        ) : (
          <div className="space-y-4">
            {provas
              .filter((p) => !p.fechada)
              .map((prova) => (
                <div key={prova.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg">
                          {prova.tipo_customizado ? prova.titulo_customizado : prova.tipo.toUpperCase()}
                        </h3>
                        {!prova.votacao_aberta && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-medium">
                            🔒 Votação Fechada
                          </span>
                        )}
                      </div>
                      {prova.tipo_customizado && (
                        <p className="text-pink-300 text-xs">Prova Customizada • Escolher {prova.max_escolhas} {prova.max_escolhas === 1 ? 'pessoa' : 'pessoas'}</p>
                      )}
                      {prova.descricao && (
                        <p className="text-white/60 text-sm">{prova.descricao}</p>
                      )}
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(prova.data_prova).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Selecione o vencedor para fechar a prova:
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            fecharProva(prova.id, e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecione o vencedor...</option>
                        {participantes
                          .filter((p) => p.ativo)
                          .map((participante) => (
                            <option key={participante.id} value={participante.id}>
                              {participante.nome}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => toggleVotacao(prova.id, prova.votacao_aberta)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                          prova.votacao_aberta
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/20'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-300 border-green-500/20'
                        }`}
                      >
                        {prova.votacao_aberta ? '🔒 Fechar Votação' : '🔓 Abrir Votação'}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => arquivarProva(prova.id)}
                          className="flex-1 py-2 px-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-sm font-medium transition-all border border-yellow-500/20"
                        >
                          📦 Arquivar
                        </button>
                        <button
                          onClick={() => deletarProva(prova.id)}
                          className="flex-1 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm font-medium transition-all border border-red-500/20"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Provas Fechadas */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">✅ Provas Fechadas</h2>
        {provas.filter((p) => p.fechada).length === 0 ? (
          <p className="text-white/60 text-center py-8">Nenhuma prova fechada</p>
        ) : (
          <div className="space-y-4">
            {provas
              .filter((p) => p.fechada)
              .map((prova) => {
                const vencedor = participantes.find((p) => p.id === prova.vencedor_id);
                return (
                  <div key={prova.id} className="bg-white/5 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-lg">
                            {prova.tipo_customizado ? prova.titulo_customizado : prova.tipo.toUpperCase()}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                            Encerrada
                          </span>
                        </div>
                        {prova.tipo_customizado && (
                          <p className="text-pink-300 text-xs">Prova Customizada • {prova.max_escolhas} {prova.max_escolhas === 1 ? 'pessoa' : 'pessoas'}</p>
                        )}
                        {prova.descricao && (
                          <p className="text-white/60 text-sm">{prova.descricao}</p>
                        )}
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(prova.data_prova).toLocaleDateString('pt-BR')}
                        </p>
                        {vencedor && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-yellow-400 text-lg">🏆</span>
                            <span className="text-white font-medium">{vencedor.nome}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => reabrirProva(prova.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm font-medium transition-all border border-blue-500/20"
                      >
                        🔓 Reabrir
                      </button>
                      <button
                        onClick={() => arquivarProva(prova.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-sm font-medium transition-all border border-yellow-500/20"
                      >
                        📦 Arquivar
                      </button>
                      <button
                        onClick={() => deletarProva(prova.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm font-medium transition-all border border-red-500/20"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
