import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { RefreshCw, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import type { ScanResponse } from '../App';

interface ScannerProps {
  scanMode: number;
  result: ScanResponse | null;
  setResult: React.Dispatch<React.SetStateAction<ScanResponse | null>>;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ scanMode, result, setResult, onBack }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // KUNCI UTAMA: Untuk mencegah pengiriman API ganda
  const isProcessing = useRef<boolean>(false);

  useEffect(() => {
    if (!result) {
      // Reset kunci saat kamera siap digunakan kembali
      isProcessing.current = false;

      const timer = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          false
        );
        scannerRef.current.render(onScanSuccess, () => {});
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.error(e));
        }
      };
    }
  }, [scanMode, result]);

  async function onScanSuccess(decodedText: string) {
    // Jika sedang memproses atau sudah ada hasil, blokir semua scan tambahan
    if (isProcessing.current || result || loading) return;

    // Aktifkan kunci
    isProcessing.current = true;
    setLoading(true);

    // Hentikan kamera segera
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch (e) {
        console.warn("Gagal pause kamera:", e);
      }
    }

    try {
      const response = await fetch('https://api-tedxuii.vercel.app/api/v1/ticket-scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code: decodedText, scan_mode: scanMode })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ status: 'error', ui_color: 'red', message: 'Koneksi ke server terputus.' });
      // Jika error koneksi, kita buka kuncinya agar bisa coba lagi
      isProcessing.current = false;
    } finally {
      setLoading(false);
    }
  }

  // PERBAIKAN: Penyesuaian Nama Mode Sesuai Konsep 3 Tiket Baru
  const modeName = 
    scanMode === 1 ? 'CHECK-IN MORNING' : 
    scanMode === 2 ? 'CHECK-IN AFTERNOON' : 
    'KLAIM MERCH/SERTIF';

  if (result) {
    return (
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl text-center">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${
            result.ui_color === 'green' ? 'bg-green-100 text-green-600' :
            result.ui_color === 'yellow' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {result.status === 'success' ? <ShieldCheck size={50}/> : <LogOut size={50}/>}
          </div>
          
          <h2 className={`text-3xl font-black mb-3 tracking-tight ${
            result.ui_color === 'green' ? 'text-green-700' :
            result.ui_color === 'yellow' ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {result.status === 'success' ? 'VALID' :
             result.status === 'warning' ? 'PERHATIAN' : 'DITOLAK'}
          </h2>
          
          <p className="text-slate-600 font-bold text-lg leading-relaxed mb-8 whitespace-pre-line">
            {result.message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                isProcessing.current = false; // Buka kunci sebelum reset
                setResult(null);
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black active:scale-95 transition-all shadow-xl"
            >
              LANJUT SCAN TIKET
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold text-md hover:bg-gray-200 active:scale-95 transition-all"
            >
              KEMBALI KE MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="flex justify-between items-center mb-6 px-1">
        <button 
          onClick={onBack} 
          className="bg-white/10 p-3 rounded-xl text-white hover:bg-white/30 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right text-white">
          <p className="text-[10px] opacity-70 font-medium uppercase tracking-wider">Mode Aktif</p>
          <p className="font-bold text-sm bg-white/20 px-3 py-1 rounded-lg mt-1">{modeName}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden relative">
        <div id="reader" className="overflow-hidden rounded-2xl"></div>
        
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <RefreshCw className="text-white animate-spin mb-4" size={40} />
            <p className="text-white font-bold animate-pulse tracking-widest">MEMVERIFIKASI...</p>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-white/80 text-sm font-semibold italic bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
        Arahkan kamera tepat ke QR Code tiket
      </p>
    </div>
  );
};

export default Scanner;