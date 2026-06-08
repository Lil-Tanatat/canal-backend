const router = require('express').Router();
const db     = require('../db');
const multer = require('multer');
const path   = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

const storage = multer.diskStorage({
  destination: 'uploads/tools/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.ID || Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/tools
router.get('/', async (req, res) => {
  const { condition, search } = req.query;
  let sql = 'SELECT * FROM tool WHERE 1=1';
  const params = [];
  if (condition) { sql += ' AND tool_condition = ?'; params.push(condition); }
  if (search) {
    sql += ' AND (ID LIKE ? OR `Desc` LIKE ? OR place LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY Date_of_Buy DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/tools/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM tool WHERE ID = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบอุปกรณ์' });
  res.json(rows[0]);
});

// POST /api/tools
router.post('/', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { ID, Desc, Price, tool_store, place, Date_of_Buy, tool_condition, ETC } = req.body;
  // เช็ค ID ซ้ำ
  const [exist] = await db.query('SELECT ID FROM tool WHERE ID = ?', [ID]);
  if (exist.length) return res.status(400).json({ error: `ID "${ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น` });
  const picture = req.file ? `/uploads/tools/${req.file.filename}` : '';
  await db.query(
    `INSERT INTO tool (ID, \`Desc\`, Picture, Price, tool_store, place, Date_of_Buy, tool_condition, ETC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ID, Desc, picture, Price || 0, tool_store, place, Date_of_Buy, tool_condition || 'New', ETC || 0]
  );
  res.status(201).json({ ok: true });
});

// PUT /api/tools/:id
router.put('/:id', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { Desc, Price, tool_store, place, Date_of_Buy, tool_condition, ETC } = req.body;
  const picture = req.file ? `/uploads/tools/${req.file.filename}` : req.body.Picture;
  await db.query(
    `UPDATE tool SET \`Desc\`=?, Picture=?, Price=?, tool_store=?, place=?,
     Date_of_Buy=?, tool_condition=?, ETC=? WHERE ID=?`,
    [Desc, picture, Price, tool_store, place, Date_of_Buy, tool_condition, ETC, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE /api/tools/:id
router.delete('/:id', requireRole('แอดมิน'), async (req, res) => {
  await db.query('DELETE FROM tool WHERE ID = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
