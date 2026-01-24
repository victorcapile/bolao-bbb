import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import FloatingTop3 from './components/FloatingTop3';
import LiderAnjoWeek from './components/LiderAnjoWeek';
import FloatingNews from './components/FloatingNews';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Apostas from './pages/Apostas';
import Ranking from './pages/Ranking';
import Amigos from './pages/Amigos';
import Feed from './pages/Feed';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import { useEffect } from 'react';

// Esquemas de cores para cada dia da semana (rotaciona a cada 7 dias)
const colorSchemes = [
  { from: 'from-slate-900', via: 'via-purple-900', to: 'to-slate-900' },      // Domingo - Roxo (original)
  { from: 'from-slate-900', via: 'via-blue-900', to: 'to-slate-900' },        // Segunda - Azul
  { from: 'from-slate-900', via: 'via-pink-900', to: 'to-slate-900' },        // Terça - Rosa
  { from: 'from-slate-900', via: 'via-indigo-900', to: 'to-slate-900' },      // Quarta - Indigo
  { from: 'from-slate-900', via: 'via-violet-900', to: 'to-slate-900' },      // Quinta - Violeta
  { from: 'from-slate-900', via: 'via-fuchsia-900', to: 'to-slate-900' },     // Sexta - Fuchsia
  { from: 'from-slate-900', via: 'via-rose-900', to: 'to-slate-900' },        // Sábado - Rose
];

function App() {
  useEffect(() => {
    // Pegar o dia da semana (0-6, onde 0 = domingo)
    const dayOfWeek = new Date().getDay();
    const scheme = colorSchemes[dayOfWeek];

    // Aplicar as classes no body
    document.body.className = `bg-gradient-to-br ${scheme.from} ${scheme.via} ${scheme.to} min-h-screen font-sans antialiased`;
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <FloatingTop3 />
          <LiderAnjoWeek />
          <FloatingNews />
          <main className="container mx-auto px-4 py-6 max-w-7xl mt-24 md:mt-20">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/registrar" element={<Registrar />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Apostas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ranking"
                element={
                  <PrivateRoute>
                    <Ranking />
                  </PrivateRoute>
                }
              />
              <Route
                path="/amigos"
                element={
                  <PrivateRoute>
                    <Amigos />
                  </PrivateRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <PrivateRoute>
                    <Feed />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stats"
                element={
                  <PrivateRoute>
                    <Stats />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <p className="text-center text-white/30 text-xs py-6 font-medium">
            Feito com ❤️ por Victor Capilé
          </p>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
