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
  const [novaProva, setNovaProva] = useState({ tipo: '', descricao: '', data_prova: '' });
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
    if (!novaProva.tipo || !novaProva.data_prova) {
      alert('Preencha tipo e data da prova');
      return;
    }

    try {
      const { error } = await supabase
        .from('provas')
        .insert({
          tipo: novaProva.tipo,
          descricao: novaProva.descricao,
          data_prova: novaProva.data_prova,
          fechada: false,
        });

      if (error) throw error;
      alert('Prova criada com sucesso! ✅');
      setNovaProva({ tipo: '', descricao: '', data_prova: '' });
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

      {/* Criar Nova Prova */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">➕ Criar Nova Prova</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Tipo *</label>
            <select
              value={novaProva.tipo}
              onChange={(e) => setNovaProva({ ...novaProva, tipo: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecione...</option>
              <option value="lider">Líder</option>
              <option value="anjo">Anjo</option>
              <option value="bate_volta">Bate e Volta</option>
            </select>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">Data *</label>
            <input
              type="date"
              value={novaProva.data_prova}
              onChange={(e) => setNovaProva({ ...novaProva, data_prova: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">Descrição</label>
            <input
              type="text"
              value={novaProva.descricao}
              onChange={(e) => setNovaProva({ ...novaProva, descricao: e.target.value })}
              placeholder="Opcional..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          onClick={criarProva}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all"
        >
          Criar Prova
        </button>
      </div>

      {/* Adicionar Participante */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">➕ Adicionar Participante</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Nome *</label>
            <input
              type="text"
              value={novoParticipante.nome}
              onChange={(e) => setNovoParticipante({ ...novoParticipante, nome: e.target.value })}
              placeholder="Nome do participante"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">URL da Foto</label>
            <input
              type="text"
              value={novoParticipante.foto_url}
              onChange={(e) => setNovoParticipante({ ...novoParticipante, foto_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          onClick={adicionarParticipante}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all"
        >
          Adicionar Participante
        </button>
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
                    className="w-12 h-12 rounded-full object-cover"
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
                      className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all ${
                        participante.is_lider_atual
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                          : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                      }`}
                    >
                      👑 Líder
                    </button>
                    <button
                      onClick={() => definirAnjo(participante.id)}
                      className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all ${
                        participante.is_anjo_atual
                          ? 'bg-pink-500/30 text-pink-200 border border-pink-500/50'
                          : 'bg-pink-500/10 text-pink-300 hover:bg-pink-500/20'
                      }`}
                    >
                      😇 Anjo
                    </button>
                  </div>
                )}
                <button
                  onClick={() => toggleParticipanteAtivo(participante.id, participante.ativo)}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    participante.ativo
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

      {/* Provas */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">🏆 Provas Abertas</h2>
        <div className="space-y-4">
          {provas
            .filter((p) => !p.fechada)
            .map((prova) => (
              <div key={prova.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {prova.tipo.toUpperCase()}
                    </h3>
                    {prova.descricao && (
                      <p className="text-white/60 text-sm">{prova.descricao}</p>
                    )}
                    <p className="text-white/40 text-xs mt-1">
                      {new Date(prova.data_prova).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

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
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
