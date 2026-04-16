import { useEffect, useState } from 'react';
import Menu from './components/Menu';
import ManualTicketPage from './components/ManualTicketPage';
import OrderDashboard from './components/OrderDashboard';
import Scanner from './components/Scanner';

export interface ScanResponse {
  status: 'success' | 'warning' | 'error';
  ui_color: 'green' | 'yellow' | 'red';
  message: string;
  peserta?: string;
}

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'scanner'>('menu');
  const [scanMode, setScanMode] = useState<number>(1);
  const [result, setResult] = useState<ScanResponse | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      setResult(null);
      setCurrentScreen('menu');
    }
  };

  const getBgColor = () => {
    if (currentPath === '/recap' || currentPath === '/manual-ticket') return 'bg-[#050816]';
    if (currentScreen === 'menu') return 'bg-slate-900';
    if (!result) return 'bg-slate-900';
    if (result.ui_color === 'green') return 'bg-green-600';
    if (result.ui_color === 'yellow') return 'bg-amber-500';
    if (result.ui_color === 'red') return 'bg-rose-600';
    return 'bg-slate-900';
  };

  const handleSelectMode = (mode: number) => {
    setScanMode(mode);
    setCurrentScreen('scanner');
    setResult(null);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setResult(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getBgColor()}`}>
      <div className="mx-auto flex min-h-screen w-full flex-col px-4 py-6 sm:px-6">
        <header className="mb-6 text-center text-white">
          <h1 className="text-xl font-black tracking-tighter sm:text-2xl">TEDXUII OPERATIONAL</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/60">
            Public Order Board and Scanner Module
          </p>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
          {currentPath === '/recap' ? (
            <OrderDashboard
              onOpenScanner={() => navigateTo('/')}
              onOpenManualTicket={() => navigateTo('/manual-ticket')}
            />
          ) : null}
          {currentPath === '/manual-ticket' ? <ManualTicketPage onBack={() => navigateTo('/recap')} /> : null}
          {currentPath !== '/recap' && currentPath !== '/manual-ticket' && currentScreen === 'menu' ? <Menu onSelectMode={handleSelectMode} /> : null}
          {currentPath !== '/recap' && currentPath !== '/manual-ticket' && currentScreen === 'scanner' ? (
            <Scanner
              scanMode={scanMode}
              result={result}
              setResult={setResult}
              onBack={handleBackToMenu}
            />
          ) : null}
        </main>

        {currentPath === '/recap' || currentPath === '/manual-ticket' ? null : (
          <footer className="pt-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigateTo('/recap')}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Buka recap order
              </button>
              <button
                onClick={() => navigateTo('/manual-ticket')}
                className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-50 transition hover:bg-red-500/20"
              >
                Buat ticket manual
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
