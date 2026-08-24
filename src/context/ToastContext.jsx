import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import Icon from '../components/common/Icon';


const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    clearTimeout(timersRef.current[id]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timersRef.current[id];
    }, 200);
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      if (!message) return null;
      let newId = null;
      setToasts((prev) => {
        if (prev.some((t) => t.message === message && !t.exiting)) {
          return prev;
        }
        newId = ++idCounter;
        timersRef.current[newId] = setTimeout(() => removeToast(newId), duration);
        return [...prev, { id: newId, message, type, exiting: false }];
      });
      return newId;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      warning: (msg) => addToast(msg, 'warning'),
      info: (msg) => addToast(msg, 'info'),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
          >
            <span className="toast-icon">
              {t.type === 'success' && (
                <Icon name="check" />
              )}
              {t.type === 'error' && (
                <Icon name="x" />
              )}
              {t.type === 'warning' && (
                <Icon name="custom-3714a1b9" />
              )}
              {t.type === 'info' && (
                <Icon name="custom-2ef8bf7a" />
              )}
            </span>
            <span>{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="إغلاق الإشعار / Close notification">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
