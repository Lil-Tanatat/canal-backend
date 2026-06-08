// public/sw.js  ← วางไฟล์นี้ที่ /public/sw.js (root ของ Vite project)

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { return; }

  const options = {
    body: data.body || '',
    icon: '/icon-192.png',   // ใส่ไอคอนโรงแรมถ้ามี ถ้าไม่มีลบบรรทัดนี้ได้
    badge: '/badge-72.png',  // ไอคอนเล็กบน Android
    tag: `notif-${data.stuffId || Date.now()}`,  // tag เดียวกัน = แทนที่ noti เดิม
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      stuffId: data.stuffId,
      type: data.type,
      url: '/',
    },
    actions: [
      { action: 'view', title: '📋 ดูงาน' },
      { action: 'dismiss', title: 'ปิด' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hotel Maintenance', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // เปิด / focus หน้าต่างแอป
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        list[0].focus();
        list[0].postMessage({ type: 'NOTIF_CLICK', stuffId: event.notification.data?.stuffId });
      } else {
        clients.openWindow('/');
      }
    })
  );
});
