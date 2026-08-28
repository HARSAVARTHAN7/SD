import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transition-all transform translate-y-0 animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-white border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-white border-rose-500/30'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 text-white border-amber-500/30'
              : 'bg-slate-900/90 text-white border-slate-700'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold tracking-tight">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
