import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Participante } from '../lib/supabase';

export default function LiderAnjoWeek() {
  const [lider, setLider] = useState<Participante | null>(null);
  const [anjo, setAnjo] = useState<Participante | null>(null);
  const [imunizados, setImunizados] = useState<Participante[]>([]);

  useEffect(() => {
    carregarLiderAnjo();

    const channel = supabase
      .channel('lider_anjo_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participantes' }, () => {
        carregarLiderAnjo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        const imunizadosAtuais = participantes.filter(p => p.is_imune_atual);

        setLider(liderAtual || null);
        setAnjo(anjoAtual || null);
        setImunizados(imunizadosAtuais || []);
      }
    } catch (error) {
      console.error('Erro ao carregar líder e anjo:', error);
    }
  }

  if (!lider && !anjo && imunizados.length === 0) return null;

  return (
    <div className="hidden lg:flex fixed left-6 top-24 z-40 flex-col gap-4">
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

      {imunizados.length > 0 && (
        <div className="glass-dark p-4 rounded-2xl border-2 border-yellow-400/50 shadow-2xl shadow-yellow-500/20 w-40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/40 hover:border-yellow-400/70 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl">🛡️</span>
            </div>
            <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider mb-3">
              Imunizados
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {imunizados.map(imune => (
                <div key={imune.id} className="relative group">
                  <img
                    src={imune.foto_url || '/placeholder.png'}
                    alt={imune.nome}
                    className="w-10 h-10 rounded-full object-cover object-top border-2 border-yellow-400/70 shadow-lg"
                    title={imune.nome}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
