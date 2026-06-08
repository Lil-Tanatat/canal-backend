const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'กรุณากรอก username และ password' });

  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ?', [username]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// POST /api/auth/register  (แอดมินเท่านั้น — หรือใช้ตอน setup ครั้งแรก)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const validRoles = ['พนักงาน', 'ช่าง', 'แอดมิน'];
  if (!validRoles.includes(role))
    return res.status(400).json({ error: 'role ไม่ถูกต้อง' });

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, role]
  );
  res.json({ ok: true, message: 'สร้างผู้ใช้สำเร็จ' });
});

// GET /api/auth/me — ตรวจ token ยังใช้ได้ไหม
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users — ดูรายชื่อ user ทั้งหมด (แอดมินเท่านั้น)
router.get('/users', verifyToken, requireRole('แอดมิน'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, role FROM users ORDER BY id ASC'
  );
  res.json(rows);
});

// DELETE /api/auth/users/:id — ลบ user (แอดมินเท่านั้น ลบตัวเองไม่ได้)
router.delete('/users/:id', verifyToken, requireRole('แอดมิน'), async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' });
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
