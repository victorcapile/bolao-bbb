import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Participante } from '../lib/supabase';

export default function LiderAnjoWeek() {
  const [lider, setLider] = useState<Participante | null>(null);
  const [anjo, setAnjo] = useState<Participante | null>(null);

  useEffect(() => {
    carregarLiderAnjo();
  }, []);

  async function carregarLiderAnjo() {
    try {
      const { data: participantes } = await supabase
        .from('participantes')
        .select('*')
        .eq('ativo', true);

      if (participantes) {
        const liderAtual = participantes.find(p => p.is_lider_atual);
        const anjoAtual = participantes.find(p => p.is_anjo_atual);

        setLider(liderAtual || null);
        setAnjo(anjoAtual || null);
      }
    } catch (error) {
      console.error('Erro ao carregar líder e anjo:', error);
    }
  }

  if (!lider && !anjo) return null;

  return (
    <div className="fixed left-6 top-24 z-40 space-y-4">
      {lider && (
        <div className="glass-dark p-4 rounded-2xl border-2 border-purple-400/50 shadow-2xl shadow-purple-500/20 w-40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 hover:border-purple-400/70 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl">👑</span>
            </div>
            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-3">
              Líder da Semana
            </p>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl blur-sm"></div>
              <img
                src={lider.foto_url || '/placeholder.png'}
                alt={lider.nome}
                className="relative w-20 h-20 rounded-xl object-cover object-top mx-auto mb-3 border-2 border-purple-400/70 shadow-lg"
              />
            </div>
            <p className="text-white text-sm font-bold truncate px-1">{lider.nome}</p>
          </div>
        </div>
      )}

      {anjo && (
        <div className="glass-dark p-4 rounded-2xl border-2 border-pink-400/50 shadow-2xl shadow-pink-500/20 w-40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-pink-500/40 hover:border-pink-400/70 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl">😇</span>
            </div>
            <p className="text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-3">
              Anjo da Semana
            </p>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-pink-600/20 rounded-xl blur-sm"></div>
              <img
                src={anjo.foto_url || '/placeholder.png'}
                alt={anjo.nome}
                className="relative w-20 h-20 rounded-xl object-cover object-top mx-auto mb-3 border-2 border-pink-400/70 shadow-lg"
              />
            </div>
            <p className="text-white text-sm font-bold truncate px-1">{anjo.nome}</p>
          </div>
        </div>
      )}
    </div>
  );
}
