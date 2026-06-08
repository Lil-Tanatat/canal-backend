// routes/notifications.js
// ติดตั้ง dependency ก่อน: npm install web-push
// แล้วรัน: npx web-push generate-vapid-keys
// เอา key ที่ได้ใส่ใน .env

const router  = require('express').Router();
const db      = require('../db');
const webpush = require('web-push');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── VAPID setup ────────────────────────────────────────────────
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@hotel.local'),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ทุก route ต้อง login
router.use(verifyToken);

// ── helper: สร้าง notification + ส่ง push ──────────────────────
async function createNotification(db, { userIds, type, stuffId, title, body }) {
  if (!userIds.length) return;

  // บันทึกลง DB ทุก user
  const values = userIds.map(uid => [uid, type, stuffId, title, body]);
  await db.query(
    'INSERT INTO notifications (user_id, type, stuff_id, title, body) VALUES ?',
    [values]
  );

  // ส่ง Web Push ให้ทุก subscription ของ user เหล่านั้น
  const placeholders = userIds.map(() => '?').join(',');
  const [subs] = await db.query(
    `SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`,
    userIds
  );

  const payload = JSON.stringify({ title, body, type, stuffId });
  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async err => {
        // subscription หมดอายุ → ลบทิ้ง
        if (err.statusCode === 410) {
          await db.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        }
      })
    )
  );
}

// export helper ให้ stuff.js ใช้ได้
module.exports.createNotification = createNotification;

// ── GET /api/notifications ─────────────────────────────────────
// ดึง notification ของตัวเอง (ล่าสุด 50 รายการ)
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
});

// ── GET /api/notifications/unread-count ───────────────────────
router.get('/unread-count', async (req, res) => {
  const [[row]] = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );
  res.json({ count: row.count });
});

// ── PATCH /api/notifications/:id/read ────────────────────────
router.patch('/:id/read', async (req, res) => {
  await db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// ── PATCH /api/notifications/read-all ────────────────────────
router.patch('/read-all', async (req, res) => {
  await db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [req.user.id]
  );
  res.json({ ok: true });
});

// ── DELETE /api/notifications/:id ────────────────────────────
router.delete('/:id', async (req, res) => {
  await db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// ── POST /api/notifications/subscribe ────────────────────────
// browser ส่ง push subscription มาเก็บ
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return res.status(400).json({ error: 'subscription ไม่ครบถ้วน' });

  // ถ้ามีอยู่แล้ว (endpoint เดิม) ไม่ต้องบันทึกซ้ำ
  const [exist] = await db.query(
    'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [req.user.id, endpoint]
  );
  if (!exist.length) {
    await db.query(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
  }
  res.json({ ok: true });
});

// ── DELETE /api/notifications/unsubscribe ────────────────────
router.delete('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  await db.query(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [req.user.id, endpoint]
  );
  res.json({ ok: true });
});

// ── GET /api/notifications/vapid-public-key ──────────────────
// frontend ขอ public key ไปใช้ subscribe
router.get('/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// ── Deadline checker (เรียกจาก cron ใน index.js) ─────────────
async function checkDeadlines(db) {
  const today     = new Date();
  const in3days   = new Date(today); in3days.setDate(today.getDate() + 3);
  const todayStr  = today.toISOString().slice(0, 10);
  const in3Str    = in3days.toISOString().slice(0, 10);

  // หา user ที่เป็น ช่าง และ แอดมิน
  const [targets] = await db.query(
    "SELECT id FROM users WHERE role IN ('ช่าง', 'แอดมิน')"
  );
  const targetIds = targets.map(u => u.id);
  if (!targetIds.length) return;

  // งานที่ใกล้ deadline (≤ 3 วัน) และยังไม่เสร็จ
  const [soon] = await db.query(
    `SELECT ID, Desc, Place, deadline FROM stuff_to_maintenance
     WHERE State IN ('broken','wait_for_repair')
       AND deadline IS NOT NULL
       AND deadline <= ? AND deadline >= ?`,
    [in3Str, todayStr]
  );
  for (const item of soon) {
    const diff = Math.ceil((new Date(item.deadline) - today) / 86400000);
    await createNotification(db, {
      userIds: targetIds,
      type: 'deadline_soon',
      stuffId: item.ID,
      title: `⏰ ใกล้ครบกำหนด: ${item.Desc}`,
      body: `${item.Place} — เหลืออีก ${diff} วัน (${new Date(item.deadline).toLocaleDateString('th-TH')})`,
    });
  }

  // งานที่เลย deadline แล้ว
  const [passed] = await db.query(
    `SELECT ID, Desc, Place, deadline FROM stuff_to_maintenance
     WHERE State IN ('broken','wait_for_repair')
       AND deadline IS NOT NULL
       AND deadline < ?`,
    [todayStr]
  );
  for (const item of passed) {
    const diff = Math.abs(Math.ceil((new Date(item.deadline) - today) / 86400000));
    await createNotification(db, {
      userIds: targetIds,
      type: 'deadline_passed',
      stuffId: item.ID,
      title: `🚨 เลยกำหนดแล้ว: ${item.Desc}`,
      body: `${item.Place} — เลยมาแล้ว ${diff} วัน`,
    });
  }
}

module.exports.checkDeadlines = checkDeadlines;
module.exports.router = router;
