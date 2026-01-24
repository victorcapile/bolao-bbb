import type { Participante } from '../lib/supabase';

interface ProvaCardProps {
  tipo: string;
  descricao: string | null;
  dataProva: string;
  fechada: boolean;
  aposta?: {
    participante_id: string;
    pontos: number;
  };
  apostas?: Array<{
    participante_id: string;
    pontos: number;
  }>;
  participanteApostado?: Participante;
  participantesDisponiveis: Participante[];
  onVotar: (participanteId: string) => void;
  apostando: boolean;
  getTipoProvaLabel: (tipo: string) => string;
  getTipoProvaColor: (tipo: string) => string;
  formatDate: (date: string) => string;
}

export default function ProvaCard({
  tipo,
  descricao,
  dataProva,
  fechada,
  aposta,
  apostas,
  participanteApostado,
  participantesDisponiveis,
  onVotar,
  apostando,
  getTipoProvaLabel,
  getTipoProvaColor,
  formatDate
}: ProvaCardProps) {
  const isPalpiteParedao = tipo === 'palpite_paredao';
  const apostasAtuais = isPalpiteParedao ? (apostas || []) : (aposta ? [aposta] : []);
  const votosRestantes = isPalpiteParedao ? Math.max(0, 3 - apostasAtuais.length) : (aposta ? 0 : 1);
  return (
    <div className="glass rounded-2xl p-4 lg:p-5 shadow-2xl flex flex-col w-full min-h-[500px] sm:min-h-[600px] justify-between transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className={`text-xl lg:text-2xl font-bold bg-gradient-to-r ${getTipoProvaColor(tipo)} bg-clip-text text-transparent mb-1`}>
          {getTipoProvaLabel(tipo)}
        </h2>
        {descricao && (
          <p className="text-white/80 text-xs lg:text-sm mb-1">{descricao}</p>
        )}
        <span className="text-white/60 text-[10px] lg:text-xs font-medium">{formatDate(dataProva)}</span>
      </div>

      {/* Status */}
      {fechada ? (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium mb-3">
            ✓ Encerrada
          </span>
          {aposta && (
            <div>
              {aposta.pontos > 0 ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <span className="w-5 h-5 rounded-full bg-green-500/30 flex items-center justify-center text-xs">✓</span>
                  <span>Você acertou! +{aposta.pontos} pontos</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center text-xs">✕</span>
                  <span>Você apostou em: {participanteApostado?.nome}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Suas apostas */}
          {apostasAtuais.length > 0 ? (
            <div className="bg-purple-500/10 rounded-xl p-3 border-2 border-purple-500/30 mb-3">
              <p className="text-purple-200 text-[10px] lg:text-xs mb-2 font-medium">
                ✓ {isPalpiteParedao ? `Seus votos (${apostasAtuais.length}/3)` : 'Sua aposta'}
              </p>
              <div className={isPalpiteParedao ? "flex flex-wrap gap-1.5" : ""}>
                {isPalpiteParedao ? (
                  apostasAtuais.map((ap, idx) => {
                    const part = participantesDisponiveis.find(p => p.id === ap.participante_id);
                    return (
                      <button
                        key={idx}
                        onClick={() => onVotar(ap.participante_id)}
                        disabled={apostando}
                        className="group relative text-white font-bold text-xs bg-purple-500/20 px-2 py-1 rounded-full hover:bg-purple-500/30 transition-all"
                      >
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-bold">✕</span>
                        </span>
                        {part?.nome || 'N/A'}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-white font-bold text-sm lg:text-base">{participanteApostado?.nome}</p>
                )}
              </div>
              {isPalpiteParedao && votosRestantes > 0 && (
                <p className="text-purple-300 text-[9px] mt-2 italic">
                  Você ainda pode votar em mais {votosRestantes} {votosRestantes === 1 ? 'participante' : 'participantes'}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-orange-500/10 rounded-xl p-2 border border-orange-500/30 mb-3 text-center">
              <p className="text-orange-200 text-[10px] lg:text-xs italic">
                {isPalpiteParedao ? 'Toque em até 3 participantes para votar' : 'Toque em um participante para votar'}
              </p>
            </div>
          )}

          {/* Grid de participantes */}
          {participantesDisponiveis.length === 0 ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 text-center flex-1 flex items-center justify-center">
              <p className="text-orange-200 text-sm">Aguardando definição dos emparedados</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 lg:gap-3 flex-1 auto-rows-max">
              {participantesDisponiveis.map((participante) => {
                const jaVotou = apostasAtuais.some(ap => ap.participante_id === participante.id);
                return (
                  <button
                    key={participante.id}
                    className={`glass-dark rounded-lg lg:rounded-xl p-2 lg:p-3 transition-all hover:scale-105 relative ${jaVotou
                      ? 'ring-4 ring-emerald-400 bg-gradient-to-br from-emerald-500/50 to-green-500/40 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'hover:bg-white/10'
                      } ${apostando ? 'opacity-50 cursor-wait' : ''} ${!participante.ativo ? 'opacity-20' : ''}`}
                    onClick={() => onVotar(participante.id)}
                    disabled={apostando || !participante.ativo || (!isPalpiteParedao && apostasAtuais.length > 0 && !jaVotou)}
                  >
                    {jaVotou && (
                      <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center shadow-lg animate-pulse z-20">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                    {participante.is_lider_atual && (
                      <div className="absolute -top-2 -left-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center shadow-xl border border-yellow-300/50 z-10">
                        <span className="text-lg lg:text-xl">👑</span>
                      </div>
                    )}
                    {participante.is_anjo_atual && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center shadow-xl border border-blue-300/50 z-10">
                        <span className="text-lg lg:text-xl">😇</span>
                      </div>
                    )}
                    {participante.foto_url && (
                      <div className={`w-full aspect-square bg-white/5 rounded-md lg:rounded-lg mb-1 lg:mb-2 overflow-hidden ${jaVotou ? 'ring-2 ring-emerald-300/50' : ''
                        }`}>
                        <img
                          src={participante.foto_url}
                          alt={participante.nome}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    )}
                    <p className={`text-[9px] lg:text-[10px] font-semibold text-center truncate leading-tight ${jaVotou ? 'text-emerald-200' : 'text-white'
                      }`}>
                      {participante.nome}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
