import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useXP } from '../contexts/XPContext';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import NivelBadge from './NivelBadge';
import Notificacoes from './Notificacoes';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { shouldAnimate } = useXP();
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getLinkClasses = (path: string, mobile = false) => {
    if (mobile) {
      return `block font-medium py-2.5 px-3 rounded-lg transition-all ${isActive(path)
        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
        : 'text-white/80 hover:text-white hover:bg-white/10'
        }`;
    }
    return `relative px-4 py-2 rounded-full transition-all font-medium text-sm group ${isActive(path)
      ? 'text-purple-200 bg-purple-500/20 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
      : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
      }`;
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Recarregar página para atualizar avatar
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <nav className="glass fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl rounded-2xl shadow-2xl z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform">
            Bolão BBB
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className={getLinkClasses('/')}>
                Apostas
              </Link>
              <Link to="/amigos" className={getLinkClasses('/amigos')}>
                Amigos
              </Link>
              <Link to="/feed" className={getLinkClasses('/feed')}>
                Feed
              </Link>
              <Link to="/stats" className={getLinkClasses('/stats')}>
                Stats
              </Link>
              <Link to="/ranking" className={getLinkClasses('/ranking')}>
                Ranking
              </Link>
              {profile?.is_admin && (
                <Link to="/admin" className={getLinkClasses('/admin')}>
                  Admin
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Notificações */}
                <Notificacoes />

                {/* Avatar com upload */}
                <div className="relative group">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30 group-hover:border-purple-400 transition-all shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white/30 group-hover:border-purple-400 transition-all shadow-md">
                        {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>

                {/* Nome e nível */}
                <div className="hidden lg:flex flex-col items-start gap-1">
                  <span className="text-white/90 font-medium text-sm">
                    {profile?.username || user.email}
                  </span>
                  {profile && (
                    <NivelBadge
                      nivel={profile.nivel || 1}
                      xp={profile.xp || 0}
                      size="sm"
                      showXP={true}
                      triggerAnimation={shouldAnimate}
                    />
                  )}
                </div>

                {/* Botão do menu mobile */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={signOut}
                  className="hidden md:block px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all font-medium text-sm border border-white/5 hover:border-white/10"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all shadow-lg transform hover:scale-105"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Menu Mobile */}
        {user && menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-1 animate-in slide-in-from-right">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={getLinkClasses('/', true)}
            >
              Apostas
            </Link>
            <Link
              to="/amigos"
              onClick={() => setMenuOpen(false)}
              className={getLinkClasses('/amigos', true)}
            >
              Amigos
            </Link>
            <Link
              to="/feed"
              onClick={() => setMenuOpen(false)}
              className={getLinkClasses('/feed', true)}
            >
              Feed
            </Link>
            <Link
              to="/stats"
              onClick={() => setMenuOpen(false)}
              className={getLinkClasses('/stats', true)}
            >
              Stats
            </Link>
            <Link
              to="/ranking"
              onClick={() => setMenuOpen(false)}
              className={getLinkClasses('/ranking', true)}
            >
              Ranking
            </Link>
            {profile?.is_admin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={getLinkClasses('/admin', true)}
              >
                Admin
              </Link>
            )}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border border-white/20">
                  {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">{profile?.username || user.email}</span>
                  {profile && <span className="text-white/50 text-xs">Nível {profile.nivel}</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full text-left px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-red-100 transition-colors font-medium border border-red-500/10"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
