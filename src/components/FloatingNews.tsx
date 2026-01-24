import { useState } from 'react';
import TwitterFeed from './TwitterFeed';

export default function FloatingNews() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isEntering, setIsEntering] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300);
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsEntering(true);
        setTimeout(() => setIsEntering(false), 50);
    };

    return (
        <>
            {/* Botão flutuante - Posicionado abaixo do Top3 */}
            <button
                onClick={() => !isOpen ? handleOpen() : handleClose()}
                className="fixed top-[4.5rem] right-4 w-12 h-12 md:top-28 md:right-6 md:w-16 md:h-16 rounded-full glass-dark shadow-xl hover:scale-105 transition-all flex items-center justify-center text-2xl md:text-3xl z-40 border-2 border-sky-400/30 text-sky-400"
                title="Notícias Espiadinha"
            >
                📰
            </button>

            {/* Drawer lateral */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : isEntering ? 'opacity-0' : 'opacity-100'
                            }`}
                        onClick={handleClose}
                    />

                    {/* Drawer */}
                    <div className={`fixed top-0 right-0 h-full w-full max-w-sm glass-dark z-50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${isClosing ? 'translate-x-full' : isEntering ? 'translate-x-full' : 'translate-x-0'
                        }`}>
                        <div className="p-6 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                                    📰 Notícias BBB
                                </h2>
                                <button
                                    onClick={handleClose}
                                    className="text-white/80 hover:text-white text-2xl leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Feed */}
                            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                                <TwitterFeed username="canalespiadinha" />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
