import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notificacao } from '../lib/supabase';

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      carregarNotificacoes();

      // Subscribe para notificações em tempo real
      const channel = supabase
        .channel('notificacoes_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            carregarNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function carregarNotificacoes() {
    if (!user) return;

    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotificacoes(data);
      setNaoLidas(data.filter(n => !n.lida).length);
    }
  }

  async function marcarComoLida(id: string) {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    carregarNotificacoes();
  }

  async function marcarTodasComoLidas() {
    if (!user) return;

    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false);

    carregarNotificacoes();
  }

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de notificações não lidas */}
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {mostrarDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 glass-dark rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notificações</h3>
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-sm">
                  Nenhuma notificação ainda
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.lida && marcarComoLida(notif.id)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all ${
                      notif.lida
                        ? 'bg-transparent hover:bg-white/5'
                        : 'bg-purple-500/10 hover:bg-purple-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notif.tipo === 'comentario' ? (
                          <span className="text-2xl">💬</span>
                        ) : (
                          <span className="text-2xl">❤️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{notif.mensagem}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(notif.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.lida && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
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
