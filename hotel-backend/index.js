const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes  = require('./routes/auth');
const stuffRoutes = require('./routes/stuff');
const partsRoutes = require('./routes/parts');
const toolsRoutes = require('./routes/tools');
const supportRoutes = require('./routes/support');
const { router: notifRouter, checkDeadlines } = require('./routes/notifications');
const db = require('./db');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' })); // Vite default port
app.use(express.json());
app.use('/uploads', express.static('uploads'));      // serve รูปภาพ

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/stuff',   stuffRoutes);
app.use('/api/parts',   partsRoutes);
app.use('/api/tools',   toolsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notifRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Hotel Maintenance API running' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const cron = require('node-cron');
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] checking deadlines...');
  try { await checkDeadlines(db); }
  catch (e) { console.error('[cron] error:', e.message); }
}, { timezone: 'Asia/Bangkok' });