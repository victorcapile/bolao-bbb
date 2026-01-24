import { useEffect, useRef, useState } from 'react';

interface TwitterFeedProps {
    username: string;
}

export default function TwitterFeed({ username }: TwitterFeedProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scriptId = 'twitter-wjs';

        const loadWidget = () => {
            // @ts-ignore
            if (window.twttr?.widgets) {
                // @ts-ignore
                window.twttr.widgets.load(containerRef.current);
            }
        };

        // Se o script já existe, tenta carregar direto ou espera ficar pronto
        if (document.getElementById(scriptId)) {
            loadWidget();

            // Polling para garantir que se o script carregou mas o widget não estava pronto, ele carregue
            // @ts-ignore
            if (!window.twttr?.widgets) {
                const interval = setInterval(() => {
                    // @ts-ignore
                    if (window.twttr?.widgets) {
                        loadWidget();
                        clearInterval(interval);
                    }
                }, 500);
                setTimeout(() => clearInterval(interval), 10000); // Stop polling after 10s
            }
            return;
        }

        // Se não existe, cria e adiciona
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";

        script.onload = () => {
            loadWidget();
        };

        document.body.appendChild(script);

    }, [username]);

    return (
        <div className="glass rounded-xl p-4" ref={containerRef}>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-white font-semibold text-sm">Notícias (@{username})</h2>
                <a
                    href={`https://twitter.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300"
                >
                    Abrir no X ↗
                </a>
            </div>
            <div className="overflow-hidden rounded-lg min-h-[400px] bg-black/20 flex items-center justify-center">
                <a
                    className="twitter-timeline"
                    data-theme="dark"
                    data-height="600"
                    data-chrome="noheader nofooter transparent"
                    data-dnt="true"
                    href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
                >
                    <div className="p-4 text-center">
                        <p className="text-white/60 mb-2">Carregando tweets...</p>
                        <p className="text-white/30 text-xs">Se não carregar, clique no link acima.</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
