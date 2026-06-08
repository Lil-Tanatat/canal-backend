// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

function authFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
}

// แปลง base64url → Uint8Array สำหรับ VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw      = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function useNotifications(user, addToast) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [pushEnabled,   setPushEnabled]   = useState(false);
  const [swReady,       setSwReady]       = useState(false);
  const pollRef    = useRef(null);
  const prevIdsRef = useRef(null);

  // ── โหลด notifications ────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res  = await authFetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);

      // แสดง toast เฉพาะ notification ใหม่ที่ยังไม่เคยเห็น
      if (prevIdsRef.current !== null && addToast) {
        const newOnes = data.filter(
          n => !n.is_read && !prevIdsRef.current.has(n.id)
        );
        newOnes.forEach(n => addToast(n));
      }
      prevIdsRef.current = new Set(data.map(n => n.id));
    } catch {}
  }, [user, addToast]);

  // ── Polling ทุก 30 วินาที ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchNotifications]);

  // ── ลงทะเบียน Service Worker ──────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(reg => {
      setSwReady(true);
      // ฟัง message จาก sw (กด noti แล้วให้ focus งาน)
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'NOTIF_CLICK') {
          fetchNotifications();
        }
      });
    }).catch(() => {});
  }, [fetchNotifications]);

  // เช็คสถานะ push permission ตอน mount
  useEffect(() => {
    if (!swReady) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setPushEnabled(!!sub);
      });
    });
  }, [swReady]);

  // ── เปิด Push Notification ────────────────────────────────────
  const enablePush = useCallback(async () => {
    if (!swReady) return { ok: false, error: 'Service Worker ยังไม่พร้อม' };

    try {
      // ขอ permission ก่อน
      const permission = await Notification.requestPermission();
      if (permission !== 'granted')
        return { ok: false, error: 'ผู้ใช้ไม่อนุญาต Notification' };

      // ดึง VAPID public key
      const keyRes = await authFetch('/api/notifications/vapid-public-key');
      const { key } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      // ส่ง subscription ไปเก็บที่ server
      await authFetch('/api/notifications/subscribe', {
        method: 'POST',
        body:   JSON.stringify(sub),
      });

      setPushEnabled(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [swReady]);

  // ── ปิด Push Notification ─────────────────────────────────────
  const disablePush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await authFetch('/api/notifications/unsubscribe', {
          method: 'DELETE',
          body:   JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushEnabled(false);
    } catch {}
  }, []);

  // ── อ่าน notification ─────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await authFetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }, []);

  // ── ลบ notification ───────────────────────────────────────────
  const remove = useCallback(async (id) => {
    await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    pushEnabled,
    swReady,
    fetchNotifications,
    enablePush,
    disablePush,
    markRead,
    markAllRead,
    remove,
  };
}
