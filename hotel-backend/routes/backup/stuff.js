const router = require('express').Router();
const db     = require('../db');
const multer = require('multer');
const path   = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/stuff/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.ID || Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// multer สำหรับ support photo
const supportStorage = multer.diskStorage({
  destination: 'uploads/support/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `support_${Date.now()}${ext}`);
  },
});
const uploadSupport = multer({ storage: supportStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ทุก route ต้อง login ก่อน
router.use(verifyToken);

// GET /api/stuff — ดึงทั้งหมด (กรองได้ด้วย ?state=broken&type=ไฟฟ้า)
router.get('/', async (req, res) => {
  const { state, type, search } = req.query;

  let sql    = 'SELECT * FROM stuff_to_maintenance WHERE 1=1';
  const params = [];

  if (state)  { sql += ' AND State = ?';                          params.push(state); }
  if (type)   { sql += ' AND Itemtype = ?';                       params.push(type); }
  if (search) { sql += ' AND (ID LIKE ? OR `Desc` LIKE ? OR Place LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  sql += ' ORDER BY Date_of_Install DESC';

  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/stuff/:id — ดึงรายการเดียว
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM stuff_to_maintenance WHERE ID = ?', [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(rows[0]);
});

// POST /api/stuff — เพิ่มของใหม่ (แอดมินเท่านั้น)
router.post('/', requireRole('แอดมิน'), upload.single('picture'), async (req, res) => {
  const { ID, Itemtype, Desc, Price, Place, State, Date_of_Buy, Date_of_Install, qty_new, qty_used, qty_damaged, urgency, deadline, ETC } = req.body;
  // เช็ค ID ซ้ำ
  const [exist] = await db.query('SELECT ID FROM stuff_to_maintenance WHERE ID = ?', [ID]);
  if (exist.length) return res.status(400).json({ error: `ID "${ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น` });
  const picture = req.file ? `/uploads/stuff/${req.file.filename}` : '';
  await db.query(
    `INSERT INTO stuff_to_maintenance
      (ID, Itemtype, \`Desc\`, Picture, Price, Place, State, Date_of_Buy, Date_of_Install, qty_new, qty_used, qty_damaged, urgency, deadline, ETC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ID, Itemtype, Desc, picture, Price || 0, Place, State || 'ok',
     Date_of_Buy, Date_of_Install, qty_new || 0, qty_used || 0, qty_damaged || 0,
     urgency || 'medium', deadline || null, ETC || '']
  );
  res.status(201).json({ ok: true });
});

// PATCH /api/stuff/:id/state — เปลี่ยนสถานะ (core feature ของ ServiceOrder)
// พนักงาน: ok → broken เท่านั้น
// ช่าง: broken → wait_for_repair → ok
// แอดมิน: ทุก transition
router.patch('/:id/state', uploadSupport.single('photo'), async (req, res) => {
  const { state, note, damage, repairDetail } = req.body;
  const role = req.user.role;
  const id   = req.params.id;

  const validStates = ['ok', 'broken', 'wait_for_repair', 'need_replacement'];
  if (!validStates.includes(state))
    return res.status(400).json({ error: 'state ไม่ถูกต้อง' });

  // ตรวจสิทธิ์ตาม role
  const [rows] = await db.query(
    'SELECT State, `Desc`, Place, Itemtype, qty_new, qty_used, qty_damaged FROM stuff_to_maintenance WHERE ID = ?', [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบรายการ' });

  const current = rows[0].State;
  const { Desc, Place, Itemtype } = rows[0];
  const current_qty = { qty_new: rows[0].qty_new || 0, qty_used: rows[0].qty_used || 0, qty_damaged: rows[0].qty_damaged || 0 };

  const allowed = {
    'พนักงาน': { ok: 'broken', broken: 'broken' },  // แจ้งซ่อมได้เรื่อยๆ แม้ของยัง broken
    'ช่าง':    { broken: 'wait_for_repair', wait_for_repair: 'ok' },
    'แอดมิน':  { ok: 'broken', broken: 'broken', wait_for_repair: 'ok' },
  };

  // เช็คเฉพาะว่ามีสิทธิ์ไหม ไม่เช็ค exact transition สำหรับ broken→broken
  const canDo = role === 'แอดมิน' ||
    (role === 'พนักงาน' && state === 'broken') ||
    (role === 'ช่าง' && (
      (current === 'broken' && state === 'wait_for_repair') ||
      (current === 'wait_for_repair' && state === 'ok') ||
      (current === 'wait_for_repair' && state === 'need_replacement') ||
      (current === 'broken' && state === 'need_replacement') ||
      state === state // allow same-state for missing parts log
    ));

  if (!canDo)
    return res.status(403).json({ error: `role "${role}" ไม่สามารถดำเนินการนี้ได้` });

  const qty = parseInt(req.body.qty) || 0;
  // isSameState = ช่างแจ้งอะไหล่ที่ขาด (ส่ง state เดิมซ้ำ qty=0)
  // พนักงาน broken→broken = แจ้งซ่อมเพิ่ม ต้องผ่าน logic qty ปกติ
  const isSameState = current === state && role === 'ช่าง' && qty === 0;
  let { qty_new, qty_used, qty_damaged } = current_qty;

  const scrapped = req.body.scrapped === '1';

  // ถ้าเป็น same-state (แจ้งขาดอะไหล่) ไม่ต้องเปลี่ยน qty
  if (isSameState) {
    // บันทึก log อย่างเดียว ไม่เปลี่ยน qty หรือ state
  } else

  if (state === 'broken') {
    // แจ้งซ่อม: ตรวจว่ามีของใช้ได้พอ
    const available = qty_new + qty_used;
    if (available <= 0) return res.status(400).json({ error: 'ไม่มีของที่ใช้ได้อยู่แล้ว' });
    if (qty > available) return res.status(400).json({ error: `มีของที่ใช้ได้แค่ ${available} ชิ้น` });
    const fromNew = Math.min(qty, qty_new);
    qty_new  -= fromNew;
    qty_used -= (qty - fromNew);
    qty_damaged += qty;

  } else if (state === 'wait_for_repair') {
    // ช่างรับงาน: ไม่เปลี่ยน qty

  } else if (state === 'ok') {
    // ซ่อมเสร็จ: หัก qty_damaged เพิ่ม qty_used
    if (qty_damaged <= 0) return res.status(400).json({ error: 'ไม่มีของที่รอซ่อมอยู่' });
    if (qty > qty_damaged) return res.status(400).json({ error: `มีของที่รอซ่อมแค่ ${qty_damaged} ชิ้น` });
    qty_damaged -= qty;
    qty_used    += qty;

  } else if (state === 'need_replacement') {
    // ต้องซื้อใหม่: ย้าย qty_damaged ไป qty_scrapped
    if (qty_damaged <= 0) return res.status(400).json({ error: 'ไม่มีของที่รอซ่อมอยู่' });
    const scrapQty = qty_damaged; // ย้ายทั้งหมด
    qty_damaged = 0;
    // qty_scrapped จะถูก update แยกถ้า column มีอยู่
  }

  // คำนวณ finalState
  let finalState;
  if (isSameState) {
    finalState = current; // ไม่เปลี่ยน state
  } else if (state === 'need_replacement') {
    finalState = 'need_replacement';
  } else if (state === 'wait_for_repair') {
    finalState = 'wait_for_repair';
  } else if (qty_damaged > 0) {
    finalState = 'broken';
  } else {
    finalState = 'ok';
  }

  // อัปเดต urgency/deadline ถ้าส่งมาด้วย (ตอนพนักงานแจ้งซ่อม)
  const urgency = req.body.urgency;
  const deadline = req.body.deadline || null;

  // ถ้า need_replacement ให้เพิ่ม qty_scrapped ด้วย (ถ้า column มีอยู่)
  if (state === 'need_replacement') {
    try {
      await db.query(
        'UPDATE stuff_to_maintenance SET State=?, qty_new=?, qty_used=?, qty_damaged=?, qty_scrapped=qty_scrapped+? WHERE ID=?',
        [finalState, qty_new, qty_used, qty_damaged, current_qty.qty_damaged, id]
      );
    } catch {
      // ถ้า column ยังไม่มี fallback เป็น query ธรรมดา
      await db.query(
        'UPDATE stuff_to_maintenance SET State=?, qty_new=?, qty_used=?, qty_damaged=? WHERE ID=?',
        [finalState, qty_new, qty_used, qty_damaged, id]
      );
    }
  } else {
    await db.query(
      `UPDATE stuff_to_maintenance SET State=?, qty_new=?, qty_used=?, qty_damaged=?
       ${urgency ? ', urgency=?' : ''}
       ${deadline !== undefined ? ', deadline=?' : ''}
       WHERE ID=?`,
      [finalState, qty_new, qty_used, qty_damaged,
       ...(urgency ? [urgency] : []),
       ...(deadline !== undefined ? [deadline] : []),
       id]
    );
  }

  // บันทึก log ลง support
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const supportID = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth()+1)}${pad(now.getDate())}${Date.now().toString().slice(-4)}`;
    const stateLabel = { ok: 'ปกติ', broken: 'พัง', wait_for_repair: 'กำลังซ่อม' };
    const typeMap = { 'ไฟฟ้า': 'electrical wiring', 'ประปา': 'waterworks', 'เครื่องใช้ไฟฟ้า': 'appliances', 'แอร์': 'air_wiring', 'โครงสร้าง': '', 'อื่นๆ': '' };
    const supportType = typeMap[Itemtype] || '';
    const report = state === 'broken'
      ? `แจ้งซ่อม จำนวน ${qty} ชิ้น${damage ? ': ' + damage : ''}`
      : state === 'ok'
      ? `ซ่อมเสร็จ จำนวน ${qty} ชิ้น`
      : `รับงานซ่อม`;
    const repairDetailsLog = state === 'ok' ? (repairDetail || note || '') : (note || '');
    const photoPath = req.file ? `/uploads/support/${req.file.filename}` : '';
    const etc = `โดย: ${req.user.username} (${req.user.role})`;
    await db.query(
      `INSERT INTO support (ID, `+"`Desc`"+`, Place, Type, Report, repair_details, Manual, ETC)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [supportID, `ซ่อม: ${Desc}`, Place, supportType, report, repairDetailsLog, photoPath, etc]
    );
  } catch (e) {
    console.error('support log error:', e.message);
  }

  res.json({ ok: true, from: current, to: finalState, newState: finalState, qty_new, qty_used, qty_damaged });
});

// PUT /api/stuff/:id — แก้ข้อมูลทั้งหมด (แอดมิน)
router.put('/:id', requireRole('แอดมิน'), upload.single('picture'), async (req, res) => {
  const { Itemtype, Desc, Price, Place, State, Date_of_Buy, Date_of_Install, qty_new, qty_used, qty_damaged, urgency, deadline, ETC } = req.body;
  const picture = req.file ? `/uploads/stuff/${req.file.filename}` : req.body.Picture;
  await db.query(
    `UPDATE stuff_to_maintenance
     SET Itemtype=?, \`Desc\`=?, Picture=?, Price=?, Place=?, State=?,
         Date_of_Buy=?, Date_of_Install=?, qty_new=?, qty_used=?, qty_damaged=?,
         urgency=?, deadline=?, ETC=?
     WHERE ID=?`,
    [Itemtype, Desc, picture, Price, Place, State, Date_of_Buy, Date_of_Install,
     qty_new || 0, qty_used || 0, qty_damaged || 0,
     urgency || 'medium', deadline || null, ETC, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE /api/stuff/:id (แอดมิน)
router.delete('/:id', requireRole('แอดมิน'), async (req, res) => {
  await db.query('DELETE FROM stuff_to_maintenance WHERE ID = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
