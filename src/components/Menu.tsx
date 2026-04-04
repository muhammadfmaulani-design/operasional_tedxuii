import React from 'react';
import { Camera, ShieldCheck, Award } from 'lucide-react';

interface MenuProps {
  onSelectMode: (mode: number) => void;
}

const Menu: React.FC<MenuProps> = ({ onSelectMode }) => {
  const modes = [
    { 
      m: 1, 
      icon: <Camera size={32} />, 
      label: 'MODE 1: CHECK-IN PAGI', 
      desc: 'Scan semua tiket masuk (Sesi 1 & Sesi 2)' 
    },
    { 
      m: 2, 
      icon: <ShieldCheck size={32} />, 
      label: 'MODE 2: SESI 2 (VIP)', 
      desc: 'Hanya izinkan pemegang tiket Full Session' 
    },
    { 
      m: 3, 
      icon: <Award size={32} />, 
      label: 'MODE 3: KLAIM SERTIFIKAT', 
      desc: 'Catat data peserta untuk e-Sertifikat' 
    }
  ];

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <h2 className="text-white text-center font-bold mb-6 opacity-80">Pilih Mode Operasional:</h2>
      
      {modes.map((item) => (
        <button
          key={item.m}
          onClick={() => onSelectMode(item.m)}
          className="flex items-center p-5 rounded-2xl bg-white/10 text-white hover:bg-white hover:text-slate-900 hover:scale-[1.02] active:scale-95 transition-all group text-left shadow-lg"
        >
          <div className="bg-white/20 group-hover:bg-slate-100 p-4 rounded-xl mr-4 transition-colors">
            {item.icon}
          </div>
          <div>
            <h3 className="font-black text-lg">{item.label}</h3>
            <p className="text-sm opacity-70 font-medium group-hover:opacity-100">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Menu;