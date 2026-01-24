import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notificacao } from '../lib/supabase';

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      carregarNotificacoes();

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMostrarDropdown(false);
      setIsClosing(false);
    }, 200);
  };

  const getTempoDecorrido = (data: string) => {
    const agora = new Date();
    const notif = new Date(data);
    const diff = agora.getTime() - notif.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'agora';
    if (minutos < 60) return `${minutos}min`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
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

        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {mostrarDropdown && (
        <>
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-200 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleClose}
          />

          <div className={`absolute right-0 mt-3 w-[380px] max-w-[calc(100vw-2rem)] glass rounded-2xl shadow-2xl border border-white/20 z-50 overflow-hidden transition-all duration-200 ${
            isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
          }`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Notificações</h3>
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="text-purple-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[70vh] overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-white/40 text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="p-2">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.lida && marcarComoLida(notif.id)}
                      className={`group relative rounded-xl p-3 mb-2 cursor-pointer transition-all ${
                        notif.lida
                          ? 'hover:bg-white/5'
                          : 'bg-white/10 hover:bg-white/[0.15]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            notif.tipo === 'comentario'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-pink-500/20 text-pink-300'
                          }`}>
                            {notif.tipo === 'comentario' ? '💬' : '❤️'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 ${
                            notif.lida ? 'text-white/70' : 'text-white font-medium'
                          }`}>
                            {notif.mensagem}
                          </p>
                          <p className="text-white/40 text-xs">
                            {getTempoDecorrido(notif.created_at)}
                          </p>
                        </div>

                        {!notif.lida && (
                          <div className="shrink-0">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
