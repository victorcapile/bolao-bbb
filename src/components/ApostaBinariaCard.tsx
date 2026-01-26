interface ApostaBinariaCardProps {
  pergunta: string;
  dataProva: string;
  fechada: boolean;
  aposta?: {
    resposta_binaria: string;
    pontos: number;
  };
  oddsSim: number;
  oddsNao: number;
  pontosBase: number;
  respostaCorreta?: string | null;
  onVotar: (resposta: 'sim' | 'nao') => void;
  apostando: boolean;
  formatDate: (date: string) => string;
  votacao_aberta?: boolean;
}

export default function ApostaBinariaCard({
  pergunta,
  fechada,
  aposta,
  oddsSim,
  oddsNao,
  pontosBase,
  respostaCorreta,
  onVotar,
  apostando,
  votacao_aberta = true
}: ApostaBinariaCardProps) {
  const pontosSim = Math.round(pontosBase * oddsSim);
  const pontosNao = Math.round(pontosBase * oddsNao);

  return (
    <div className="glass rounded-2xl p-4 lg:p-5 shadow-2xl flex flex-col w-full min-h-[400px] justify-between transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
          Aposta Sim/Não
        </h2>
        <p className="text-white/90 text-sm lg:text-base font-medium">{pergunta}</p>
      </div>

      {/* Status */}
      {!votacao_aberta && !fechada && (
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30 mb-4">
          <div className="flex items-center gap-2 text-red-300 text-sm font-medium">
            <span className="text-lg">🔒</span>
            <span>Votação Encerrada - Não é mais possível votar</span>
          </div>
        </div>
      )}

      {fechada ? (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium mb-3">
            ✓ Encerrada
          </span>
          {aposta && (
            <div>
              <p className="text-white/70 text-xs mb-2">
                Você apostou em: <span className="font-bold text-white uppercase">{aposta.resposta_binaria}</span>
              </p>
              {aposta.pontos > 0 ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <span className="w-5 h-5 rounded-full bg-green-500/30 flex items-center justify-center text-xs">✓</span>
                  <span>Você acertou! +{aposta.pontos} pontos</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center text-xs">✕</span>
                  <span>Resposta correta era: <span className="uppercase font-bold">{respostaCorreta}</span></span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Sua aposta */}
          {aposta ? (
            <div className={`rounded-xl p-4 border-2 mb-4 shadow-lg ${
              aposta.resposta_binaria === 'sim'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/40'
                : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-400/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs lg:text-sm font-bold flex items-center gap-2 ${
                  aposta.resposta_binaria === 'sim' ? 'text-green-200' : 'text-red-200'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    aposta.resposta_binaria === 'sim' ? 'bg-green-500/30' : 'bg-red-500/30'
                  }`}>
                    {aposta.resposta_binaria === 'sim' ? '✓' : '✕'}
                  </span>
                  Sua Aposta
                </span>
                <span className={`text-[10px] italic ${
                  aposta.resposta_binaria === 'sim' ? 'text-green-300' : 'text-red-300'
                }`}>Clique para mudar</span>
              </div>
              <div className={`rounded-lg p-3 text-center ${
                aposta.resposta_binaria === 'sim' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <p className="text-white font-extrabold text-2xl lg:text-3xl uppercase tracking-wide">
                  {aposta.resposta_binaria}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-3 border border-orange-500/30 mb-4 text-center">
              <p className="text-orange-200 text-xs lg:text-sm font-medium flex items-center justify-center gap-2">
                <span className="text-base">👇</span>
                Escolha SIM ou NÃO para fazer sua aposta
              </p>
            </div>
          )}

          {/* Botões de votação */}
          <div className="grid grid-cols-2 gap-3 flex-1 items-center">
            <button
              onClick={() => onVotar('sim')}
              disabled={apostando || !votacao_aberta}
              className={`glass-dark rounded-xl p-4 lg:p-6 transition-all hover:scale-105 relative ${
                aposta?.resposta_binaria === 'sim'
                  ? 'ring-4 ring-emerald-400 bg-gradient-to-br from-emerald-500/50 to-green-500/40 shadow-lg shadow-emerald-500/30 scale-105'
                  : 'hover:bg-white/10'
              } ${apostando ? 'opacity-50 cursor-wait' : ''}`}
            >
              {aposta?.resposta_binaria === 'sim' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center shadow-lg animate-pulse z-20">
                  <span className="text-white text-sm lg:text-base font-bold">✓</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-5xl lg:text-7xl mb-3 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                  <span className="bg-gradient-to-br from-green-400 to-emerald-500 bg-clip-text text-transparent font-bold">✓</span>
                </div>
                <div className="text-white font-bold text-lg lg:text-xl mb-2">SIM</div>
                <div className="text-green-300 text-sm lg:text-base font-bold mb-1">
                  {pontosSim} pts
                </div>
                <div className="text-green-400/80 text-xs lg:text-sm font-semibold">
                  {oddsSim}x
                </div>
              </div>
            </button>

            <button
              onClick={() => onVotar('nao')}
              disabled={apostando || !votacao_aberta}
              className={`glass-dark rounded-xl p-4 lg:p-6 transition-all hover:scale-105 relative ${
                aposta?.resposta_binaria === 'nao'
                  ? 'ring-4 ring-emerald-400 bg-gradient-to-br from-emerald-500/50 to-green-500/40 shadow-lg shadow-emerald-500/30 scale-105'
                  : 'hover:bg-white/10'
              } ${apostando ? 'opacity-50 cursor-wait' : ''}`}
            >
              {aposta?.resposta_binaria === 'nao' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center shadow-lg animate-pulse z-20">
                  <span className="text-white text-sm lg:text-base font-bold">✓</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-5xl lg:text-7xl mb-3 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">
                  <span className="bg-gradient-to-br from-red-400 to-rose-500 bg-clip-text text-transparent font-bold">✕</span>
                </div>
                <div className="text-white font-bold text-lg lg:text-xl mb-2">NÃO</div>
                <div className="text-red-300 text-sm lg:text-base font-bold mb-1">
                  {pontosNao} pts
                </div>
                <div className="text-red-400/80 text-xs lg:text-sm font-semibold">
                  {oddsNao}x
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
