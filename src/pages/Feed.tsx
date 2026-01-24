import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FeedAtividade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StreakNotification from '../components/StreakNotification';

import FeedItem from '../components/FeedItem';

export default function Feed() {
  const [atividades, setAtividades] = useState<FeedAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStreakNotification, setShowStreakNotification] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const { user } = useAuth();

  // ... (useEffect and loading logic remains the same)

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel('feed_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_atividades' }, (payload) => {
        loadFeed();
        if (user && payload.new) {
          const newActivity = payload.new as any;
          if (newActivity.user_id === user.id && newActivity.tipo === 'streak') {
            const streakValue = newActivity.metadata?.streak;
            if (streakValue && streakValue >= 3) {
              setCurrentStreak(streakValue);
              setShowStreakNotification(true);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadFeed = async () => {
    try {
      const { data: atividadesData, error: atividadesError } = await supabase
        .from('feed_atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (atividadesError) throw atividadesError;

      if (!atividadesData || atividadesData.length === 0) {
        setAtividades([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(atividadesData.map(a => a.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, nivel')
        .in('id', userIds);

      const atividadesComDetalhes = atividadesData.map(item => {
        const profile = profilesData?.find(p => p.id === item.user_id);

        let xp = item.metadata?.xp;
        let pontos = item.metadata?.pontos;

        if (!xp) {
          if (item.tipo === 'acerto') xp = 50;
          else if (item.tipo === 'voto') xp = 10;
        }

        return {
          ...item,
          username: profile?.username || 'Usuário',
          avatar_url: profile?.avatar_url || null,
          nivel: profile?.nivel || 1,
          displayXp: xp,
          displayPontos: pontos,
          // Garante que o metadata esteja disponível na raiz apenas se necessário, mas o original já está em item.metadata
        };
      });

      setAtividades(atividadesComDetalhes);
    } catch (error) {
      console.error('Erro ao carregar feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'acerto':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'erro':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'streak':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'nivel_up':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 'lideranca':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getTempoDecorrido = (data: string) => {
    const agora = new Date();
    const atividade = new Date(data);
    const diff = agora.getTime() - atividade.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'agora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass rounded-2xl px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Carregando feed...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showStreakNotification && (
        <StreakNotification
          streak={currentStreak}
          onClose={() => setShowStreakNotification(false)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Feed
          </h1>
        </div>

        {atividades.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/60 text-sm">Nenhuma atividade recente.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atividades.map((atividade: any) => (
              <FeedItem
                key={atividade.id}
                atividade={atividade}
                getIconByTipo={getIconByTipo}
                getTempoDecorrido={getTempoDecorrido}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
