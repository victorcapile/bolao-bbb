interface Top3Item {
  nome?: string;
  foto_url?: string | null;
}

interface UserTop3Props {
  top3?: {
    primeiro?: Top3Item;
    segundo?: Top3Item;
    terceiro?: Top3Item;
    updated_at?: string;
  };
}

export default function UserTop3({ top3 }: UserTop3Props) {
  if (!top3) return null;

  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        {top3.primeiro ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-200 text-[12px]">🥇</div>
            <span className="text-xs text-yellow-100 font-semibold truncate max-w-[160px]">{top3.primeiro.nome}</span>
          </div>
        ) : null}

        {top3.segundo ? (
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded-full bg-gray-400/20 flex items-center justify-center text-gray-200 text-[12px]">🥈</div>
            <span className="text-xs text-white/60 truncate max-w-[140px]">{top3.segundo.nome}</span>
          </div>
        ) : null}

        {top3.terceiro ? (
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-200 text-[12px]">🥉</div>
            <span className="text-xs text-white/60 truncate max-w-[140px]">{top3.terceiro.nome}</span>
          </div>
        ) : null}
      </div>

      {top3.updated_at && (
        <span className="text-[11px] text-white/40">Atualizado: {new Date(top3.updated_at).toLocaleDateString('pt-BR')}</span>
      )}
    </div>
  );
}
