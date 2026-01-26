import { useEffect, useState } from 'react';

interface NivelBadgeProps {
  nivel: number;
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
  triggerAnimation?: boolean;
}

export default function NivelBadge({ nivel, xp, size = 'md', showXP = true, triggerAnimation = false }: NivelBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayXP, setDisplayXP] = useState(xp);

  // Calcular XP necessário para próximo nível
  const xpParaProximo = nivel * 100;
  const porcentagem = (displayXP / xpParaProximo) * 100;

  // Trigger animation quando XP mudar
  useEffect(() => {
    if (triggerAnimation && xp > displayXP) {
      setIsAnimating(true);

      // Animar o número de XP subindo
      const diff = xp - displayXP;
      const duration = 800;
      const steps = 20;
      const increment = diff / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayXP(xp);
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 500);
        } else {
          setDisplayXP(prev => Math.min(prev + increment, xp));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayXP(xp);
    }
  }, [xp, triggerAnimation]);

  // Cores únicas para cada nível
  const getNivelGradient = (nivel: number): string => {
    const colors = [
      'from-orange-600 via-amber-700 to-orange-600',      // Nível 1
      'from-amber-500 via-yellow-600 to-amber-500',       // Nível 2
      'from-yellow-500 via-amber-400 to-yellow-500',      // Nível 3
      'from-lime-500 via-green-400 to-lime-500',          // Nível 4
      'from-green-500 via-emerald-400 to-green-500',      // Nível 5
      'from-emerald-500 via-teal-400 to-emerald-500',     // Nível 6
      'from-teal-500 via-cyan-400 to-teal-500',           // Nível 7
      'from-cyan-500 via-sky-400 to-cyan-500',            // Nível 8
      'from-sky-500 via-blue-400 to-sky-500',             // Nível 9
      'from-blue-500 via-indigo-400 to-blue-500',         // Nível 10
      'from-indigo-500 via-violet-400 to-indigo-500',     // Nível 11
      'from-violet-500 via-purple-400 to-violet-500',     // Nível 12
      'from-purple-500 via-fuchsia-400 to-purple-500',    // Nível 13
      'from-fuchsia-500 via-pink-400 to-fuchsia-500',     // Nível 14
      'from-pink-500 via-rose-400 to-pink-500',           // Nível 15
      'from-rose-500 via-red-400 to-rose-500',            // Nível 16
      'from-red-500 via-orange-400 to-red-500',           // Nível 17
      'from-orange-500 via-amber-400 to-orange-500',      // Nível 18
      'from-amber-400 via-yellow-500 to-amber-400',       // Nível 19
      'from-yellow-400 via-lime-500 to-yellow-400',       // Nível 20
      'from-lime-400 via-green-500 to-lime-400',          // Nível 21
      'from-green-400 via-emerald-500 to-green-400',      // Nível 22
      'from-emerald-400 via-teal-500 to-emerald-400',     // Nível 23
      'from-teal-400 via-cyan-500 to-teal-400',           // Nível 24
      'from-cyan-400 via-sky-500 to-cyan-400',            // Nível 25
      'from-sky-400 via-blue-500 to-sky-400',             // Nível 26
      'from-blue-400 via-indigo-500 to-blue-400',         // Nível 27
      'from-indigo-400 via-violet-500 to-indigo-400',     // Nível 28
      'from-violet-400 via-purple-500 to-violet-400',     // Nível 29
      'from-purple-400 via-fuchsia-500 to-purple-400',    // Nível 30
      'from-fuchsia-400 via-pink-500 to-fuchsia-400',     // Nível 31
      'from-pink-400 via-rose-500 to-pink-400',           // Nível 32
      'from-rose-400 via-red-500 to-rose-400',            // Nível 33
      'from-red-400 via-orange-500 to-red-400',           // Nível 34
      'from-orange-400 via-amber-500 to-orange-400',      // Nível 35
      'from-yellow-300 via-amber-500 to-yellow-300',      // Nível 36
      'from-lime-300 via-green-500 to-lime-300',          // Nível 37
      'from-green-300 via-emerald-500 to-green-300',      // Nível 38
      'from-emerald-300 via-teal-500 to-emerald-300',     // Nível 39
      'from-purple-600 via-pink-500 to-red-500',          // Nível 40+
    ];

    // Para níveis acima de 40, usar cores especiais
    if (nivel >= 50) return 'from-red-500 via-orange-500 to-yellow-500';
    if (nivel >= 40) return colors[39];

    // Para níveis 1-39, usar a cor correspondente
    const index = Math.min(Math.max(nivel - 1, 0), colors.length - 1);
    return colors[index];
  };

  // Tamanhos escalados por nível
  const getSizeClasses = (baseSize: string, nivel: number): string => {
    const scale = nivel >= 20 ? 1.3 : nivel >= 10 ? 1.15 : 1;
    const sizeMap = {
      sm: {
        1: 'text-xs px-2 py-0.5',
        1.15: 'text-sm px-2.5 py-0.5',
        1.3: 'text-sm px-3 py-1'
      },
      md: {
        1: 'text-sm px-2.5 py-1',
        1.15: 'text-base px-3 py-1',
        1.3: 'text-lg px-3.5 py-1.5'
      },
      lg: {
        1: 'text-base px-3 py-1.5',
        1.15: 'text-lg px-4 py-2',
        1.3: 'text-xl px-5 py-2.5'
      }
    };

    return sizeMap[baseSize as keyof typeof sizeMap][scale];
  };

  const badgeClass = getSizeClasses(size, nivel);
  const gradientClass = getNivelGradient(nivel);

  return (
    <div className="flex items-center gap-2">
      {/* Badge de nível */}
      <div className={`${badgeClass} rounded-full bg-gradient-to-r ${gradientClass} text-white font-bold shadow-lg flex items-center gap-1 ${nivel >= 10 ? 'shadow-2xl ring-2 ring-white/30' : ''} ${isAnimating ? 'scale-110' : ''} transition-transform duration-300`}>
        <span className="text-[10px] font-semibold">LVL</span>
        <span>{nivel}</span>
      </div>

      {/* Barra de XP */}
      {showXP && (
        <div className={`flex flex-col gap-0.5 ${isAnimating ? 'scale-105' : ''} transition-transform duration-300`}>
          <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden relative">
            <div
              className={`h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ${isAnimating ? 'shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''}`}
              style={{ width: `${Math.min(porcentagem, 100)}%` }}
            />
            {isAnimating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] text-white/60 font-medium ${isAnimating ? 'text-purple-300' : ''} transition-colors duration-300`}>
              {Math.floor(displayXP)}/{xpParaProximo} XP
            </span>
            {isAnimating && (
              <span className="text-[10px] text-green-400 font-bold animate-pulse">+50</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
