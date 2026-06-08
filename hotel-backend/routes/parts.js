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
  const { search } = req.query;
  let sql = 'SELECT * FROM parts WHERE 1=1';
  const params = [];
  if (search) {
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

// POST /api/parts
router.post('/', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { ID, Desc, Price, part_store, place, Date_of_Buy, qty_new, qty_used, qty_damaged, ETC } = req.body;
  // เช็ค ID ซ้ำ
  const [exist] = await db.query('SELECT ID FROM parts WHERE ID = ?', [ID]);
  if (exist.length) return res.status(400).json({ error: `ID "${ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น` });
  const picture = req.file ? `/uploads/parts/${req.file.filename}` : '';
  await db.query(
    `INSERT INTO parts (ID, \`Desc\`, Picture, Price, part_store, place, Date_of_Buy, qty_new, qty_used, qty_damaged, ETC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ID, Desc, picture, Price || 0, part_store, place, Date_of_Buy, qty_new || 0, qty_used || 0, qty_damaged || 0, ETC || '']
  );
  res.status(201).json({ ok: true });
});

// PUT /api/parts/:id
router.put('/:id', requireRole('ช่าง', 'แอดมิน'), upload.single('picture'), async (req, res) => {
  const { Desc, Price, part_store, place, Date_of_Buy, qty_new, qty_used, qty_damaged, ETC } = req.body;
  const picture = req.file ? `/uploads/parts/${req.file.filename}` : req.body.Picture;
  await db.query(
    `UPDATE parts SET \`Desc\`=?, Picture=?, Price=?, part_store=?, place=?,
     Date_of_Buy=?, qty_new=?, qty_used=?, qty_damaged=?, ETC=? WHERE ID=?`,
    [Desc, picture, Price, part_store, place, Date_of_Buy, qty_new || 0, qty_used || 0, qty_damaged || 0, ETC, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE /api/parts/:id
router.delete('/:id', requireRole('แอดมิน'), async (req, res) => {
  await db.query('DELETE FROM parts WHERE ID = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
