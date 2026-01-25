import { useEffect, useState } from 'react';

interface XPAnimationProps {
  xp: number;
  onComplete?: () => void;
}

export default function XPAnimation({ xp, onComplete }: XPAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce-slow">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-6 py-3 shadow-2xl shadow-purple-500/50 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-white font-bold text-xl">+{xp} XP</span>
            <span className="text-2xl">✨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
