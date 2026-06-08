// src/components/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';

const TYPE_CONFIG = {
  new_repair:       { icon: '🔧', color: '#dc2626', bg: '#fee2e2', label: 'งานซ่อมใหม่' },
  deadline_soon:    { icon: '⏰', color: '#d97706', bg: '#fef3c7', label: 'ใกล้ครบกำหนด' },
  deadline_passed:  { icon: '🚨', color: '#7c3aed', bg: '#f3e8ff', label: 'เลยกำหนดแล้ว' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (m < 1)  return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  return `${d} วันที่แล้ว`;
}

export default function NotificationBell({
  notifications = [],
  unreadCount   = 0,
  pushEnabled   = false,
  swReady       = false,
  onMarkRead,
  onMarkAllRead,
  onRemove,
  onEnablePush,
  onDisablePush,
}) {
  const [open,       setOpen]       = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg,    setPushMsg]    = useState('');
  const ref = useRef(null);

  // ปิด dropdown เมื่อ click นอก
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushMsg('');
    const fn = pushEnabled ? onDisablePush : onEnablePush;
    const result = await fn();
    if (result?.error) setPushMsg(result.error);
    else setPushMsg(pushEnabled ? 'ปิด notification แล้ว' : 'เปิด notification แล้ว');
    setPushLoading(false);
    setTimeout(() => setPushMsg(''), 3000);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Bell Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="การแจ้งเตือน"
        style={{
          position: 'relative',
          width: 40, height: 40,
          borderRadius: 10,
          border: open ? '1.5px solid #1e40af' : '1.5px solid #e2e8f0',
          background: open ? '#eff6ff' : '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          transition: 'all .15s',
          flexShrink: 0,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18,
            background: '#dc2626', color: '#fff',
            borderRadius: 99, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #fff',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0,
          width: 360,
          maxHeight: 520,
          background: '#fff',
          borderRadius: 14,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'notifFadeIn .15s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>การแจ้งเตือน</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#fee2e2', color: '#dc2626',
                  fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 99,
                }}>
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} style={{
                  fontSize: 11, color: '#1e40af', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  padding: '3px 8px', borderRadius: 6,
                  fontFamily: 'inherit',
                }}>
                  อ่านทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* Push Toggle */}
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0,
          }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                {pushEnabled ? '🔔 Push เปิดอยู่' : '🔕 Push ปิดอยู่'}
              </span>
              {pushMsg && (
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{pushMsg}</span>
              )}
            </div>
            {swReady && (
              <button
                onClick={handleTogglePush}
                disabled={pushLoading}
                style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 6,
                  border: `1.5px solid ${pushEnabled ? '#fca5a5' : '#1e40af'}`,
                  background: pushEnabled ? '#fff' : '#eff6ff',
                  color: pushEnabled ? '#dc2626' : '#1e40af',
                  cursor: pushLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {pushLoading ? '...' : pushEnabled ? 'ปิด' : 'เปิด'}
              </button>
            )}
            {!swReady && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Browser ไม่รองรับ</span>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                color: '#94a3b8', fontSize: 13,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                ไม่มีการแจ้งเตือน
              </div>
            ) : (
              notifications.map(n => {
                const cfg   = TYPE_CONFIG[n.type] || TYPE_CONFIG.new_repair;
                const isNew = !n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && onMarkRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      background: isNew ? '#f0f9ff' : '#fff',
                      cursor: isNew ? 'pointer' : 'default',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      transition: 'background .1s',
                      position: 'relative',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: cfg.color, background: cfg.bg,
                          padding: '1px 6px', borderRadius: 99,
                        }}>
                          {cfg.label}
                        </span>
                        {isNew && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#1e40af', display: 'inline-block',
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: isNew ? 700 : 500,
                        color: '#1e293b', marginBottom: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: 12, color: '#64748b',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Delete btn */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(n.id); }}
                      title="ลบ"
                      style={{
                        background: 'none', border: 'none',
                        fontSize: 14, color: '#cbd5e1',
                        cursor: 'pointer', padding: '2px 4px',
                        borderRadius: 4, flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
