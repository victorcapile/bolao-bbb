import type { FC } from 'react';

interface ParticipanteLite {
  id: string;
  nome?: string;
}

interface VotoTop3UI {
  id: string;
  user_id: string;
  username?: string;
  primeiro?: ParticipanteLite | null;
  segundo?: ParticipanteLite | null;
  terceiro?: ParticipanteLite | null;
  updated_at?: string;
}

interface Props {
  votosTop3: VotoTop3UI[];
  currentUserId?: string | null;
}

const Top3UsersList: React.FC<Props> = ({ votosTop3, currentUserId }) => {
  if (!votosTop3 || votosTop3.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">🏆 Top 3 dos Usuários</h3>
      <p className="text-white/60 text-sm mb-4">Veja quem cada jogador acha que vai ganhar o BBB</p>

      <div className="space-y-4">
        {votosTop3.map((voto) => {
          const isMyVote = voto.user_id === currentUserId;
          return (
            <div
              key={voto.id}
              className={`bg-white/5 rounded-xl p-4 border ${isMyVote ? 'border-purple-500/50 ring-2 ring-purple-500/30' : 'border-white/10'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">@{voto.username}</span>
                  {isMyVote && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-medium">Você</span>
                  )}
                </div>
                <span className="text-white/40 text-xs">{voto.updated_at ? new Date(voto.updated_at).toLocaleDateString('pt-BR') : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <span className="text-2xl">🥇</span>
                  <div className="flex-1">
                    <div className="text-yellow-200 text-xs font-medium">1º Lugar</div>
                    <div className="text-white font-bold text-sm">{voto.primeiro?.nome || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-400/10 border border-gray-400/30 rounded-lg p-3">
                  <span className="text-2xl">🥈</span>
                  <div className="flex-1">
                    <div className="text-gray-200 text-xs font-medium">2º Lugar</div>
                    <div className="text-white font-bold text-sm">{voto.segundo?.nome || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-orange-600/10 border border-orange-600/30 rounded-lg p-3">
                  <span className="text-2xl">🥉</span>
                  <div className="flex-1">
                    <div className="text-orange-200 text-xs font-medium">3º Lugar</div>
                    <div className="text-white font-bold text-sm">{voto.terceiro?.nome || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Top3UsersList;
