import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, MessageCircle } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in ${
              toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
              'bg-white text-slate-800 border border-border'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {toast.type === 'info' && <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-muted hover:text-primary"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { addToast: () => {} };
}

export function toast(message, type = 'info') {
  const { addToast } = useToast();
  addToast(message, type);
}
