import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
          maxWidth: 400,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          let bg = 'var(--ink)';
          let fg = '#ffffff';
          let border = 'transparent';

          if (t.type === 'success') {
            bg = '#1e4620';
            border = '#2e7d32';
          } else if (t.type === 'error') {
            bg = '#5c1d1d';
            border = '#c62828';
          } else if (t.type === 'warning') {
            bg = '#5c3e09';
            border = '#d97706';
          }

          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: bg,
                color: fg,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                animation: 'slideIn 0.2s ease-out',
              }}
            >
              <span>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  opacity: 0.7,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy if used outside provider
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      info: (msg) => console.log('Toast info:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
    };
  }
  return context;
};
