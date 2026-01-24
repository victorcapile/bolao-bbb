import { useState } from 'react';
import ProvaCard from './ProvaCard';
import type { Participante, Prova, Aposta } from '../lib/supabase';

interface ProvaComDetalhes extends Prova {
  vencedor?: Participante;
  aposta?: Aposta;
  apostas?: Aposta[];
  participante_apostado?: Participante;
  emparedados?: string[];
}

interface ProvaCarouselProps {
  provas: ProvaComDetalhes[];
  getParticipantesParaProva: (prova: ProvaComDetalhes) => Participante[];
  fazerAposta: (provaId: string, participanteId: string) => void;
  apostando: string | null;
  getTipoProvaLabel: (tipo: string) => string;
  getTipoProvaColor: (tipo: string) => string;
  formatDate: (date: string) => string;
}

export default function ProvaCarousel({
  provas,
  getParticipantesParaProva,
  fazerAposta,
  apostando,
  getTipoProvaLabel,
  getTipoProvaColor,
  formatDate
}: ProvaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : provas.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < provas.length - 1 ? prev + 1 : 0));
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (provas.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center flex items-center justify-center h-full">
        <p className="text-white/60 text-lg">Nenhuma prova disponível no momento</p>
      </div>
    );
  }

  const currentProva = provas[currentIndex];

  return (
    <div className="relative">
      {/* Indicadores */}
      <div className="flex items-center justify-center gap-1.5 mb-6 pt-2">
        {provas.map((prova, index) => {
          const temVoto = prova.aposta || (prova.apostas && prova.apostas.length > 0);
          const isFechada = prova.fechada;

          let dotColor = '';
          if (isFechada) {
            dotColor = 'bg-white/20';
          } else if (temVoto) {
            dotColor = 'bg-emerald-400/60';
          } else {
            dotColor = 'bg-rose-400/60';
          }

          return (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all rounded-full ${index === currentIndex
                ? `w-4 h-1.5 ${dotColor}`
                : `w-1.5 h-1.5 ${dotColor} opacity-50 hover:opacity-100`
                }`}
              aria-label={`Ir para prova ${index + 1}`}
            />
          );
        })}
      </div>

      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <ProvaCard
          tipo={currentProva.tipo}
          descricao={currentProva.descricao}
          dataProva={currentProva.data_prova}
          fechada={currentProva.fechada}
          aposta={currentProva.aposta}
          apostas={currentProva.apostas}
          participanteApostado={currentProva.participante_apostado}
          participantesDisponiveis={getParticipantesParaProva(currentProva)}
          onVotar={(participanteId) => fazerAposta(currentProva.id, participanteId)}
          apostando={apostando === currentProva.id}
          getTipoProvaLabel={getTipoProvaLabel}
          getTipoProvaColor={getTipoProvaColor}
          formatDate={formatDate}
        />

        {/* Botões de navegação */}
        {provas.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
              aria-label="Prova anterior"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
              aria-label="Próxima prova"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Contador */}
      <div className="text-center mt-3 shrink-0">
        <span className="text-white/50 text-xs font-medium">
          {currentIndex + 1} / {provas.length}
        </span>
      </div>
    </div>
  );
}
