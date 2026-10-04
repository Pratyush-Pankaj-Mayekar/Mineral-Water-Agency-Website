import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: CircleAlert, info: Info };

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3800);
  }, []);
  const dismiss = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {items.map((item) => {
        const Icon = icons[item.type] || Info;
        return <div className={`toast toast-${item.type}`} role="status" key={item.id}><Icon size={19} /><span>{item.message}</span><button className="icon-button toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><X size={16} /></button></div>;
      })}
    </div>
  </ToastContext.Provider>;
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context.toast;
}
