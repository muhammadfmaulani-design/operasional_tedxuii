import { useState } from 'react';
import Menu from './components/Menu';
import Scanner from './components/Scanner';

export interface ScanResponse {
  status: 'success' | 'warning' | 'error';
  ui_color: 'green' | 'yellow' | 'red';
  message: string;
  peserta?: string;
}

const App = () => {
  // Tambahan state untuk mengontrol halaman
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'scanner'>('menu');
  const [scanMode, setScanMode] = useState<number>(1);
  const [result, setResult] = useState<ScanResponse | null>(null);

  const getBgColor = () => {
    if (currentScreen === 'menu') return 'bg-slate-900';
    if (!result) return 'bg-slate-900';
    if (result.ui_color === 'green') return 'bg-green-600';
    if (result.ui_color === 'yellow') return 'bg-amber-500';
    if (result.ui_color === 'red') return 'bg-rose-600';
    return 'bg-slate-900';
  };

  const handleSelectMode = (mode: number) => {
    setScanMode(mode);
    setCurrentScreen('scanner'); // Pindah ke halaman kamera
    setResult(null); 
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu'); // Pindah kembali ke menu
    setResult(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col ${getBgColor()}`}>
      <div className="p-6 text-center text-white">
        <h1 className="text-xl font-black tracking-tighter">TEDXUII SCANNER</h1>
        <p className="text-xs opacity-70 uppercase tracking-widest mt-1">Operational Module</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 w-full">
        {/* Render bersyarat: Tampilkan Menu ATAU Scanner */}
        {currentScreen === 'menu' ? (
          <Menu onSelectMode={handleSelectMode} />
        ) : (
          <Scanner 
            scanMode={scanMode} 
            result={result} 
            setResult={setResult} 
            onBack={handleBackToMenu} 
          />
        )}
      </div>
    </div>
  );
};

export default App;