import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Toast { id: string; type: 'success' | 'error'; message: string; }
interface ToastCtx { toast: (type: 'success' | 'error', message: string) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${t.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' : 'bg-red-900 border-red-700 text-red-100'}`}>
            {t.type === 'success' ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
