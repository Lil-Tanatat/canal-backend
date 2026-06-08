const router = require('express').Router();
const db     = require('../db');
const multer = require('multer');
const path   = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Setup multer สำหรับ upload รูปอะไหล่
const storage = multer.diskStorage({
  destination: 'uploads/parts/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.ID || Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// GET /api/parts
router.get('/', async (req, res) => {
  const { condition, search } = req.query;
  let sql = 'SELECT * FROM parts WHERE 1=1';
  const params = [];

  if (condition) { sql += ' AND part_condition = ?'; params.push(condition); }
  if (search)    {
    sql += ' AND (ID LIKE ? OR `Desc` LIKE ? OR place LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY Date_of_Buy DESC';

  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/parts/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM parts WHERE ID = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบอะไหล่' });
  res.json(rows[0]);
});

// POST /api/parts — เพิ่มอะไหล่ใหม่ พร้อม upload รูป
router.post('/', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { ID, Desc, Price, part_store, place, Date_of_Buy, part_condition, ETC } = req.body;
  const picture = req.file ? `/uploads/parts/${req.file.filename}` : '';

  await db.query(
    `INSERT INTO parts (ID, \`Desc\`, Picture, Price, part_store, place, Date_of_Buy, part_condition, ETC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ID, Desc, picture, Price || 0, part_store, place, Date_of_Buy, part_condition || 'New', ETC || '']
  );
  res.status(201).json({ ok: true });
});

// PUT /api/parts/:id
router.put('/:id', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { Desc, Price, part_store, place, Date_of_Buy, part_condition, ETC } = req.body;
  const picture = req.file ? `/uploads/parts/${req.file.filename}` : req.body.Picture;

  await db.query(
    `UPDATE parts SET \`Desc\`=?, Picture=?, Price=?, part_store=?, place=?,
     Date_of_Buy=?, part_condition=?, ETC=? WHERE ID=?`,
    [Desc, picture, Price, part_store, place, Date_of_Buy, part_condition, ETC, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE /api/parts/:id
router.delete('/:id', requireRole('แอดมิน'), async (req, res) => {
  await db.query('DELETE FROM parts WHERE ID = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
