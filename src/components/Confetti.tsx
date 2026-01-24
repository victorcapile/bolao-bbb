import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number; delay: number }>>([]);

  useEffect(() => {
    if (!trigger) return;

    // Gerar 50 partículas com posições e delays aleatórios
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
    }));

    setParticles(newParticles);

    // Limpar após animação
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confetti-fall 3s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
