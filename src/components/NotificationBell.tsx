import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Notificacao } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificacoes();

      // Realtime subscription para novas notificações
      const subscription = supabase
        .channel('notificacoes_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotificacoes(prev => [payload.new as Notificacao, ...prev]);
            setNaoLidas(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadNotificacoes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao carregar notificações:', error);
      return;
    }

    setNotificacoes(data || []);
    setNaoLidas(data?.filter(n => !n.lida).length || 0);
  };

  const marcarComoLida = async (id: string) => {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    setNotificacoes(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
    setNaoLidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;

    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false);

    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  };

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'pontos_ganhos':
        return '🎉';
      case 'nivel_up':
        return '🎊';
      case 'nova_prova':
        return '🎯';
      case 'badge':
        return '🏆';
      default:
        return '✨';
    }
  };

  const getTempoRelativo = (created_at: string) => {
    const agora = new Date();
    const data = new Date(created_at);
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {naoLidas > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </div>
        )}
      </button>

      {/* Dropdown de notificações */}
      {mostrarDropdown && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarDropdown(false)}
          />

          {/* Painel de notificações */}
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-gray-900 rounded-xl shadow-2xl border border-white/10 z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Notificações</h3>
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto flex-1">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-white/50">
                  <p className="text-4xl mb-2">🔕</p>
                  <p className="text-sm">Nenhuma notificação ainda</p>
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.lida && marcarComoLida(notif.id)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all ${
                      notif.lida
                        ? 'bg-transparent hover:bg-white/5'
                        : 'bg-blue-500/10 hover:bg-blue-500/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Ícone */}
                      <div className="text-2xl flex-shrink-0">
                        {getIcone(notif.tipo)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white font-bold text-sm">
                            {notif.titulo}
                          </h4>
                          <span className="text-xs text-white/40 whitespace-nowrap">
                            {getTempoRelativo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mt-1">
                          {notif.mensagem}
                        </p>
                        {notif.pontos && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-bold">
                            <span>+{notif.pontos}</span>
                            <span>pts</span>
                          </div>
                        )}
                      </div>

                      {/* Indicador de não lida */}
                      {!notif.lida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
