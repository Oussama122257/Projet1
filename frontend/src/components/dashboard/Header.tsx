import { useEffect, useState } from 'react';
import { Coins, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../lib/api';

export function Header({ title }: { title: string }) {
  const [credit, setCredit] = useState<number | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    api.health().then(() => setOnline(true)).catch(() => setOnline(false));
    api.getCredit()
      .then(d => setCredit(d?.data?.credit ?? null))
      .catch(() => {});
  }, []);

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <h1 className="font-semibold text-gray-100">{title}</h1>
      <div className="flex items-center gap-4">
        {credit !== null && (
          <div className="flex items-center gap-1.5 text-sm text-yellow-400">
            <Coins size={14} />
            <span>{credit.toLocaleString()} credits</span>
          </div>
        )}
        <div className={`flex items-center gap-1.5 text-xs ${online ? 'text-green-400' : 'text-red-400'}`}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? 'Backend online' : 'Backend offline'}
        </div>
      </div>
    </header>
  );
}
