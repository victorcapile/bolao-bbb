import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Comentario {
    id: string;
    user_id: string;
    comentario: string;
    created_at: string;
    username?: string;
    avatar_url?: string;
}

interface FeedItemProps {
    atividade: any;
    getIconByTipo: (tipo: string) => JSX.Element;
    getTempoDecorrido: (data: string) => string;
}

export default function FeedItem({ atividade, getIconByTipo, getTempoDecorrido }: FeedItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState('');
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (expanded) {
            carregarComentarios();
        }
    }, [expanded]);

    const carregarComentarios = async () => {
        const { data, error } = await supabase
            .from('comentarios_feed')
            .select(`
                *,
                profiles:user_id (username, avatar_url)
            `)
            .eq('atividade_id', atividade.id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            const comentariosFormatados = data.map(c => ({
                ...c,
                username: c.profiles?.username,
                avatar_url: c.profiles?.avatar_url
            }));
            setComentarios(comentariosFormatados);
        }
    };

    const enviarComentario = async () => {
        if (!comment.trim() || !user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('comentarios_feed')
                .insert({
                    atividade_id: atividade.id,
                    user_id: user.id,
                    comentario: comment.trim()
                });

            if (error) throw error;

            setComment('');
            carregarComentarios();
        } catch (error: any) {
            console.error('Erro ao enviar comentário:', error);
            const errorMessage = error?.message || 'Erro desconhecido';
            alert(`Erro ao enviar comentário: ${errorMessage}\n\nVerifique se você executou o SQL em ADICIONAR-COMENTARIOS-CORRIGIDO.sql`);
        } finally {
            setLoading(false);
        }
    };

    const getFallbackText = (tipo: string) => {
        const frases = {
            voto: ["Apostou!", "Fez sua escolha.", "Tá no jogo!"],
            acerto: ["Mandou bem!", "Na mosca!", "Acertou em cheio."],
            erro: ["Errou...", "Não foi dessa vez.", "Tente novamente."],
            streak: ["Sequência incrível!", "Ninguém segura!", "On fire! 🔥"],
            nivel_up: ["Subiu de nível!", "Evoluiu!", "Mais forte!"]
        };
        const lista = frases[tipo as keyof typeof frases] || ["Atividade registrada"];
        return lista[atividade.id.charCodeAt(0) % lista.length];
    };

    return (
        <div
            className={`glass rounded-xl transition-all border-l-2 relative overflow-hidden
                    ${expanded ? 'bg-white/10 border-l-purple-500' : 'hover:bg-white/5 border-l-transparent hover:border-l-purple-400'}
                  `}
        >
            <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                {getIconByTipo(atividade.tipo)}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-bold text-xs sm:text-sm">@{atividade.username}</span>
                        {atividade.nivel && (
                            <div className="px-1.5 py-[1px] rounded-full bg-white/10 border border-white/10 text-white/90 text-[9px] font-bold flex items-center gap-0.5">
                                <span>★</span>
                                {atividade.nivel}
                            </div>
                        )}
                        <span className="text-white/30 text-[10px] ml-auto">{getTempoDecorrido(atividade.created_at)}</span>
                    </div>
                    <p className="text-white/80 text-xs leading-snug truncate">{atividade.descricao}</p>
                </div>
            </div>

            {/* Area Expandida (Compacta) */}
            {expanded && (
                <div className="px-3 pb-3 animate-fade-in">
                    {/* Detalhes da Atividade */}
                    <div className="mb-3 pl-11">
                        {(atividade.metadata?.participante_nome || atividade.metadata?.prova_tipo) ? (
                            <div className="text-xs text-white/70 flex flex-wrap gap-2 items-center">
                                {atividade.metadata?.participante_nome && (
                                    <span className="bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 text-purple-200">
                                        Votou em: <b>{atividade.metadata.participante_nome}</b>
                                    </span>
                                )}
                                {atividade.metadata?.prova_tipo && (
                                    <span className="bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 text-blue-200 capitalize">
                                        Prova: {atividade.metadata.prova_tipo.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-white/40 italic">"{getFallbackText(atividade.tipo)}"</p>
                        )}
                    </div>

                    {/* Comentários Existentes */}
                    {comentarios.length > 0 && (
                        <div className="pl-11 mb-3 space-y-2">
                            {comentarios.map((comentario) => (
                                <div key={comentario.id} className="bg-black/20 rounded-lg p-2 border border-white/5">
                                    <div className="flex items-start gap-2">
                                        {comentario.avatar_url ? (
                                            <img
                                                src={comentario.avatar_url}
                                                alt={comentario.username || ''}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-[10px]">
                                                {comentario.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-white/90 font-medium text-[11px]">
                                                    @{comentario.username || 'Usuário'}
                                                </span>
                                                <span className="text-white/30 text-[9px]">
                                                    {getTempoDecorrido(comentario.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-white/80 text-xs">{comentario.comentario}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input de Comentário */}
                    <div className="pl-11 flex gap-2">
                        <input
                            type="text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    e.preventDefault();
                                    enviarComentario();
                                }
                            }}
                            placeholder="💬 Deixe um comentário..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            disabled={loading}
                        />
                        <button
                            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-white/10 text-white p-1.5 rounded-lg transition-all disabled:opacity-50"
                            title="Enviar"
                            onClick={(e) => {
                                e.stopPropagation();
                                enviarComentario();
                            }}
                            disabled={loading || !comment.trim()}
                        >
                            {loading ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
