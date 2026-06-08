const router = require('express').Router();
const db     = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// สร้าง support ID จากวันที่: ปี(2)+เดือน(2)+วัน(2)+ลำดับ(4) = 10 หลัก
async function generateSupportID() {
  const now  = new Date();
  const pad  = n => String(n).padStart(2, '0');
  const prefix = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth()+1)}${pad(now.getDate())}`;

  const [rows] = await db.query(
    "SELECT ID FROM support WHERE ID LIKE ? ORDER BY ID DESC LIMIT 1",
    [`${prefix}%`]
  );
  const seq = rows.length ? parseInt(rows[0].ID.slice(-4)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// GET /api/support — ดึงรายการซ่อมทั้งหมด
router.get('/', async (req, res) => {
  const { type, place, search, from, to } = req.query;
  let sql = 'SELECT * FROM support WHERE 1=1';
  const params = [];

  if (type)   { sql += ' AND Type = ?';             params.push(type); }
  if (place)  { sql += ' AND Place LIKE ?';          params.push(`%${place}%`); }
  if (search) { sql += ' AND (`Desc` LIKE ? OR Report LIKE ? OR Place LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (from)   { sql += ' AND ID >= ?';               params.push(from); }
  if (to)     { sql += ' AND ID <= ?';               params.push(to); }

  sql += ' ORDER BY ID DESC';

  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/support/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM support WHERE ID = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบบันทึกการซ่อม' });
  res.json(rows[0]);
});

// POST /api/support — บันทึกการซ่อมใหม่ (ช่าง / แอดมิน)
router.post('/', requireRole('ช่าง', 'แอดมิน'), async (req, res) => {
  const { Desc, Place, Type, Report, repair_details, Manual, ETC } = req.body;
  const ID = await generateSupportID();

  await db.query(
    `INSERT INTO support (ID, Desc, Place, Type, Report, repair_details, Manual, ETC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ID, Desc, Place, Type || '', Report || '', repair_details || '', Manual || '', ETC || '']
  );
  res.status(201).json({ ok: true, ID });
});

// PUT /api/support/:id — แก้ไขบันทึก (ช่าง / แอดมิน)
router.put('/:id', requireRole('ช่าง', 'แอดมิน'), async (req, res) => {
  const { Desc, Place, Type, Report, repair_details, Manual, ETC } = req.body;
  await db.query(
    `UPDATE support SET Desc=?, Place=?, Type=?, Report=?, repair_details=?, Manual=?, ETC=?
     WHERE ID=?`,
    [Desc, Place, Type, Report, repair_details, Manual, ETC, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE /api/support/:id (แอดมิน)
router.delete('/:id', requireRole('แอดมิน'), async (req, res) => {
  await db.query('DELETE FROM support WHERE ID = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
