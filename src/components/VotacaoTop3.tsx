import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Participante } from '../lib/supabase';

interface VotacaoTop3Props {
  provaId: string;
  onVote: (participanteIds: string[]) => void;
  votosAtuais?: string[];
}

export default function VotacaoTop3({ provaId, onVote, votosAtuais = [] }: VotacaoTop3Props) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>(votosAtuais);

  useEffect(() => {
    loadParticipantes();
  }, [provaId]);

  useEffect(() => {
    setSelecionados(votosAtuais);
  }, [votosAtuais]);

  const loadParticipantes = async () => {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) {
      setParticipantes(data);
    }
  };

  const toggleParticipante = (id: string) => {
    let novaSelecao: string[];

    if (selecionados.includes(id)) {
      novaSelecao = selecionados.filter(s => s !== id);
    } else if (selecionados.length < 3) {
      novaSelecao = [...selecionados, id];
    } else {
      return;
    }

    setSelecionados(novaSelecao);
    onVote(novaSelecao);
  };

  const getPosicao = (id: string) => {
    const index = selecionados.indexOf(id);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold mb-2">Selecione o Top 3</h3>
        <p className="text-white/60 text-sm">
          {selecionados.length}/3 selecionados
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {participantes.map((participante) => {
          const posicao = getPosicao(participante.id);
          const selecionado = posicao !== null;

          return (
            <button
              key={participante.id}
              onClick={() => toggleParticipante(participante.id)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selecionado
                  ? 'border-purple-400 bg-purple-500/20 scale-105'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {selecionado && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {posicao}º
                </div>
              )}

              {participante.foto_url && (
                <img
                  src={participante.foto_url}
                  alt={participante.nome}
                  className="w-16 h-16 rounded-full mx-auto mb-2 object-cover object-top"
                />
              )}

              <p className={`text-sm font-medium text-center ${
                selecionado ? 'text-purple-200' : 'text-white/90'
              }`}>
                {participante.nome}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
