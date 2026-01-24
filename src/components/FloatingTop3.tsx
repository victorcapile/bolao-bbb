import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Participante } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function FloatingTop3() {
  const [isOpen, setIsOpen] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [primeiro, setPrimeiro] = useState('');
  const [segundo, setSegundo] = useState('');
  const [terceiro, setTerceiro] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadParticipantes();
    if (user) {
      loadTop3Atual();
    }
  }, [user]);

  const loadParticipantes = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) {
      setParticipantes(data);
    }
  };

  const loadTop3Atual = async () => {
    if (!user) return;

    try {
      // Carregar top3 atual se existir na tabela votos_top3
      const { data, error } = await supabase
        .from('votos_top3')
        .select('primeiro_lugar_id, segundo_lugar_id, terceiro_lugar_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se não encontrou registro, não é erro
        if (error.code === 'PGRST116') {
          console.log('Usuário ainda não tem top3 cadastrado');
          return;
        }
        console.error('Erro ao carregar top3:', error);
        return;
      }

      if (data) {
        console.log('Top3 carregado:', data);
        setPrimeiro(data.primeiro_lugar_id || '');
        setSegundo(data.segundo_lugar_id || '');
        setTerceiro(data.terceiro_lugar_id || '');
      }
    } catch (error) {
      console.error('Erro ao carregar top3:', error);
    }
  };

  const salvarTop3 = async () => {
    if (!primeiro || !segundo || !terceiro) {
      alert('Selecione os 3 lugares');
      return;
    }

    if (primeiro === segundo || primeiro === terceiro || segundo === terceiro) {
      alert('Você não pode selecionar o mesmo participante em lugares diferentes');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('votos_top3')
        .upsert({
          user_id: user?.id,
          primeiro_lugar_id: primeiro,
          segundo_lugar_id: segundo,
          terceiro_lugar_id: terceiro,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert('Top 3 atualizado com sucesso! 🎉');
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar top3:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getParticipanteNome = (id: string) => {
    return participantes.find(p => p.id === id)?.nome || '';
  };

  if (!user) return null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-20 h-20 rounded-full shadow-xl hover:scale-105 transition-all flex items-center justify-center text-4xl z-50 border-2 border-white/10"
        style={{ background: 'rgba(88, 28, 135, 0.4)' }}
        title="Meu Top 3"
      >
        🏆
      </button>

      {/* Drawer lateral */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full max-w-sm glass-dark z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  🏆 Meu Top 3
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* 1º Lugar */}
              <div className="mb-4">
                <label className="block text-yellow-300 font-medium mb-2 flex items-center gap-2 text-sm">
                  🥇 1º Lugar
                </label>
                <select
                  value={primeiro}
                  onChange={(e) => setPrimeiro(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border-2 border-white/20 text-white text-sm focus:outline-none focus:border-yellow-400 transition-all"
                >
                  <option value="" className="bg-purple-900">{getParticipanteNome(primeiro) || 'Selecione...'}</option>
                  {participantes.map(p => (
                    <option key={p.id} value={p.id} className="bg-purple-900">{p.nome}</option>
                  ))}
                </select>
                {primeiro && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-yellow-600/30 border-2 border-yellow-500 text-white text-sm flex items-center gap-2">
                    ✓ {getParticipanteNome(primeiro)}
                  </div>
                )}
              </div>

              {/* 2º Lugar */}
              <div className="mb-4">
                <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2 text-sm">
                  🥈 2º Lugar
                </label>
                <select
                  value={segundo}
                  onChange={(e) => setSegundo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border-2 border-white/20 text-white text-sm focus:outline-none focus:border-gray-400 transition-all"
                >
                  <option value="" className="bg-purple-900">{getParticipanteNome(segundo) || 'Selecione...'}</option>
                  {participantes.map(p => (
                    <option key={p.id} value={p.id} className="bg-purple-900">{p.nome}</option>
                  ))}
                </select>
                {segundo && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-gray-600/30 border-2 border-gray-400 text-white text-sm flex items-center gap-2">
                    ✓ {getParticipanteNome(segundo)}
                  </div>
                )}
              </div>

              {/* 3º Lugar */}
              <div className="mb-6">
                <label className="block text-orange-300 font-medium mb-2 flex items-center gap-2 text-sm">
                  🥉 3º Lugar
                </label>
                <select
                  value={terceiro}
                  onChange={(e) => setTerceiro(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border-2 border-white/20 text-white text-sm focus:outline-none focus:border-orange-400 transition-all"
                >
                  <option value="" className="bg-purple-900">{getParticipanteNome(terceiro) || 'Selecione...'}</option>
                  {participantes.map(p => (
                    <option key={p.id} value={p.id} className="bg-purple-900">{p.nome}</option>
                  ))}
                </select>
                {terceiro && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-orange-700/30 border-2 border-orange-500 text-white text-sm flex items-center gap-2">
                    ✓ {getParticipanteNome(terceiro)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mb-4 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-xs flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>Você pode alterar seu voto a qualquer momento até o final do programa!</span>
              </div>

              {/* Botão */}
              <button
                onClick={salvarTop3}
                disabled={loading || !primeiro || !segundo || !terceiro}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Atualizando...' : 'Atualizar Voto'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
