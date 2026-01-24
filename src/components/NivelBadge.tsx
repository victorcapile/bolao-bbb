interface NivelBadgeProps {
  nivel: number;
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
}

export default function NivelBadge({ nivel, xp, size = 'md', showXP = true }: NivelBadgeProps) {
  // Calcular XP necessário para próximo nível
  const xpParaProximo = nivel * 100;
  const porcentagem = (xp / xpParaProximo) * 100;

  // Cores por nível (quanto maior o nível, mais especial a cor)
  const getNivelGradient = (nivel: number): string => {
    if (nivel >= 50) return 'from-red-500 via-orange-500 to-yellow-500'; // Lendário
    if (nivel >= 40) return 'from-purple-600 via-pink-500 to-red-500'; // Épico
    if (nivel >= 30) return 'from-indigo-500 via-purple-500 to-pink-500'; // Mítico
    if (nivel >= 20) return 'from-blue-500 via-cyan-500 to-teal-500'; // Diamante
    if (nivel >= 15) return 'from-green-500 via-emerald-500 to-teal-500'; // Platina
    if (nivel >= 10) return 'from-yellow-500 via-amber-500 to-orange-500'; // Ouro
    if (nivel >= 5) return 'from-gray-400 via-gray-300 to-gray-400'; // Prata
    return 'from-orange-600 via-amber-700 to-orange-600'; // Bronze
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
      <div className={`${badgeClass} rounded-full bg-gradient-to-r ${gradientClass} text-white font-bold shadow-lg flex items-center gap-1 ${nivel >= 10 ? 'shadow-2xl ring-2 ring-white/30' : ''}`}>
        <span className="text-[10px] font-semibold">LVL</span>
        <span>{nivel}</span>
      </div>

      {/* Barra de XP */}
      {showXP && (
        <div className="flex flex-col gap-0.5">
          <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(porcentagem, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-white/60 font-medium">
            {xp}/{xpParaProximo} XP
          </span>
        </div>
      )}
    </div>
  );
}
