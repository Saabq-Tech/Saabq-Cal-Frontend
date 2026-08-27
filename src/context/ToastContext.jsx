import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Icon from "../components/common/Icon";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      if (!message) return null;

      // Prevent duplicate active toasts with the exact same message
      let isDuplicate = false;
      setToasts((prev) => {
        if (prev.some((t) => t.message === message && !t.exiting)) {
          isDuplicate = true;
        }
        return prev;
      });

      if (isDuplicate) return null;

      const id = ++idCounter;

      setToasts((prev) => [
        ...prev,
        { id, message, type, exiting: false, duration },
      ]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const toast = useMemo(
    () => ({
      success: (msg, duration = 4000) => addToast(msg, "success", duration),
      error: (msg, duration = 5000) => addToast(msg, "error", duration),
      warning: (msg, duration = 4500) => addToast(msg, "warning", duration),
      info: (msg, duration = 4000) => addToast(msg, "info", duration),
      remove: removeToast,
    }),
    [addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`toast toast-${t.type}${t.exiting ? " toast-exit" : ""}`}
            onMouseEnter={() => {
              if (timersRef.current[t.id]) {
                clearTimeout(timersRef.current[t.id]);
              }
            }}
            onMouseLeave={() => {
              if (!t.exiting && t.duration > 0) {
                timersRef.current[t.id] = setTimeout(() => {
                  removeToast(t.id);
                }, 2000);
              }
            }}
          >
            <span className="toast-icon">
              {t.type === "success" && <Icon name="check" />}
              {t.type === "error" && <Icon name="x" />}
              {t.type === "warning" && <Icon name="custom-3714a1b9" />}
              {t.type === "info" && <Icon name="custom-2ef8bf7a" />}
            </span>
            <span>{t.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="إغلاق الإشعار / Close notification"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
