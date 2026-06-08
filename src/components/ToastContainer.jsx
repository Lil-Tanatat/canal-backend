// src/components/ToastContainer.jsx
import { useState, useEffect, useCallback, useRef } from 'react';

const TYPE_CONFIG = {
  new_repair:      { icon: '🔧', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', sound: true },
  deadline_soon:   { icon: '⏰', color: '#d97706', bg: '#fffbeb', border: '#fde68a', sound: false },
  deadline_passed: { icon: '🚨', color: '#dc2626', bg: '#fff1f2', border: '#fecdd3', sound: true },
};

let toastIdCounter = 0;

// ── Hook สำหรับใช้ใน useNotifications ─────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((notification) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { ...notification, toastId: id }]);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  return { toasts, addToast, removeToast };
}

// ── Toast Item ────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // slide in
    requestAnimationFrame(() => setVisible(true));

    // auto dismiss หลัง 5 วินาที
    timerRef.current = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.toastId), 350);
  };

  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.new_repair;

  return (
    <div
      onClick={dismiss}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        cursor: 'pointer',
        maxWidth: 340,
        width: '100%',
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? 'transform .35s ease-in, opacity .35s ease-in'
          : 'transform .35s cubic-bezier(.34,1.56,.64,1), opacity .2s ease',
        position: 'relative',
        fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
      }}
    >
      {/* Icon */}
      <div style={{
        fontSize: 22, lineHeight: 1,
        flexShrink: 0, marginTop: 1,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#1e293b',
          marginBottom: 3, lineHeight: 1.3,
        }}>
          {toast.title}
        </div>
        <div style={{
          fontSize: 12, color: '#64748b', lineHeight: 1.4,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {toast.body}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: cfg.color,
          opacity: 0.4,
          animation: 'toastProgress 5s linear forwards',
        }} />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────
export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div key={toast.toastId} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
