import { useEffect, useState } from 'react';
import Confetti from './Confetti';

interface StreakNotificationProps {
  streak: number;
  onClose: () => void;
}

export default function StreakNotification({ streak, onClose }: StreakNotificationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-fechar após 5 segundos
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500); // Dar tempo para a animação de saída
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) {
    return null;
  }

  const getMessage = () => {
    if (streak >= 20) return '🔥 LENDÁRIO! 20 ACERTOS SEGUIDOS! 🔥';
    if (streak >= 15) return '⚡ IMPRESSIONANTE! 15 ACERTOS SEGUIDOS! ⚡';
    if (streak >= 10) return '🌟 INCRÍVEL! 10 ACERTOS SEGUIDOS! 🌟';
    if (streak >= 5) return '💪 SEQUÊNCIA DE OURO! 5 ACERTOS! 💪';
    if (streak >= 3) return '🔥 PEGANDO FOGO! 3 ACERTOS SEGUIDOS! 🔥';
    return `🎯 ${streak} ACERTOS SEGUIDOS! 🎯`;
  };

  const getGradient = () => {
    if (streak >= 10) return 'from-yellow-500 via-orange-500 to-red-500';
    if (streak >= 5) return 'from-orange-500 via-red-500 to-pink-500';
    return 'from-orange-500 to-red-500';
  };

  return (
    <>
      <Confetti trigger={true} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="glass rounded-3xl p-8 max-w-md w-full border-4 border-white/30 shadow-2xl animate-scaleIn">
          <div className="text-center">
            {/* Ícone animado */}
            <div className="mb-6 relative">
              <div className={`text-8xl animate-bounce ${streak >= 10 ? 'animate-pulse' : ''}`}>
                {streak >= 10 ? '🏆' : '🔥'}
              </div>
              {streak >= 10 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-yellow-500/20 rounded-full animate-ping"></div>
                </div>
              )}
            </div>

            {/* Mensagem principal */}
            <h2 className={`text-3xl font-bold bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent mb-4 animate-pulse`}>
              {getMessage()}
            </h2>

            {/* Contador de streak */}
            <div className="glass-dark rounded-2xl p-4 mb-6 border-2 border-orange-500/50">
              <div className="text-white/60 text-sm mb-1">Sequência Atual</div>
              <div className="text-6xl font-bold text-orange-400">{streak}</div>
            </div>

            {/* Descrição */}
            <p className="text-white/80 mb-6">
              Continue acertando para manter sua sequência e ganhar mais XP!
            </p>

            {/* Botão de fechar */}
            <button
              onClick={() => {
                setShow(false);
                setTimeout(onClose, 500);
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:scale-105 transition-transform shadow-lg"
            >
              Continuar Apostando
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
