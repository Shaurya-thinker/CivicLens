import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              background: toast.type === 'error' ? 'var(--error)' : 
                         toast.type === 'success' ? 'var(--success)' : 
                         'var(--primary-main)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              minWidth: '300px',
              animation: 'slideInRight 0.3s ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: 600
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              {toast.type === 'success' ? (
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : toast.type === 'error' ? (
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
