interface StreakBadgeProps {
  streakAtual: number;
  maiorStreak: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function StreakBadge({ streakAtual, maiorStreak, size = 'md', animate = false }: StreakBadgeProps) {
  if (streakAtual === 0 && maiorStreak === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const badgeClass = sizeClasses[size];
  const iconClass = iconSizes[size];

  return (
    <div className="flex items-center gap-2">
      {/* Streak Atual */}
      {streakAtual > 0 && (
        <div className={`${badgeClass} rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg flex items-center gap-1.5 ${animate ? 'animate-streak' : ''}`}>
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span>{streakAtual}</span>
        </div>
      )}

      {/* Recorde */}
      {maiorStreak > 0 && (
        <div className={`${badgeClass} rounded-full bg-white/10 border border-white/20 text-white/80 font-medium flex items-center gap-1.5`}>
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-xs">Recorde: {maiorStreak}</span>
        </div>
      )}
    </div>
  );
}
